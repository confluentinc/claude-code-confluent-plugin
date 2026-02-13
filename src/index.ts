#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ConfluentClient } from "./api/client.js";
import { saveApiKey, removeApiKey, getApiKeyForResource } from "./context.js";

const server = new McpServer({
  name: "confluent-infra",
  version: "0.1.0",
});

let client: ConfluentClient;

function getClient(): ConfluentClient {
  if (!client) {
    client = ConfluentClient.fromEnv();
  }
  return client;
}

function ok(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function fail(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [{ type: "text" as const, text: `Error: ${message}` }],
    isError: true as const,
  };
}

async function withClusterRestApi(
  cluster_id: string,
  environment_id: string,
  cluster_api_key: string,
  cluster_api_secret: string,
  method: string,
  path: string,
  body?: unknown
): Promise<unknown> {
  const cluster = await getClient().get<{ spec: { http_endpoint: string } }>(
    `/cmk/v2/clusters/${cluster_id}?environment=${environment_id}`
  );
  const restEndpoint = cluster.spec.http_endpoint;
  if (!restEndpoint) {
    throw new Error(
      "Cluster does not have a REST endpoint yet. Is it still provisioning?"
    );
  }
  const credentials = Buffer.from(
    `${cluster_api_key}:${cluster_api_secret}`
  ).toString("base64");
  const response = await fetch(`${restEndpoint}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const responseBody = await response.text();
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${responseBody}`);
  return responseBody ? JSON.parse(responseBody) : undefined;
}

async function resolveClusterCredentials(
  cluster_id: string,
  cluster_api_key?: string,
  cluster_api_secret?: string
): Promise<{ api_key: string; api_secret: string }> {
  if (cluster_api_key && cluster_api_secret) {
    return { api_key: cluster_api_key, api_secret: cluster_api_secret };
  }
  const stored = await getApiKeyForResource(cluster_id);
  if (stored) return stored;
  throw new Error(
    `No cluster API credentials provided and none found in .confluent-context.json for ${cluster_id}. ` +
      `Create one with create_api_key first.`
  );
}

// ============================================================
// Environments
// ============================================================

// --- create_environment ---

server.tool(
  "create_environment",
  "Create a new Confluent Cloud environment. Environments are containers for Kafka clusters and other resources.",
  {
    display_name: z.string().describe("A human-readable name for the environment"),
    stream_governance_package: z
      .enum(["ESSENTIALS", "ADVANCED"])
      .optional()
      .describe("Stream governance package level. ESSENTIALS enables Schema Registry."),
  },
  async ({ display_name, stream_governance_package }) => {
    try {
      const body: Record<string, unknown> = { display_name };
      if (stream_governance_package) {
        body.stream_governance = { package: stream_governance_package };
      }
      const result = await getClient().post("/org/v2/environments", body);
      return ok(result);
    } catch (error) {
      return fail(error);
    }
  }
);

// --- list_environments ---

server.tool(
  "list_environments",
  "List all Confluent Cloud environments in the organization. Returns environment IDs, names, and stream governance settings.",
  {},
  async () => {
    try {
      const result = await getClient().listAll("/org/v2/environments");
      return ok(result);
    } catch (error) {
      return fail(error);
    }
  }
);

// --- update_environment ---

server.tool(
  "update_environment",
  "Update an existing Confluent Cloud environment. Can rename or change the stream governance package. Note: downgrading from ADVANCED to ESSENTIALS is not allowed once Schema Registry is provisioned.",
  {
    environment_id: z
      .string()
      .describe("The environment ID to update (e.g., env-abc123)"),
    display_name: z
      .string()
      .optional()
      .describe("New name for the environment"),
    stream_governance_package: z
      .enum(["ESSENTIALS", "ADVANCED"])
      .optional()
      .describe(
        'Stream governance package: "ESSENTIALS" or "ADVANCED". Downgrading from ADVANCED to ESSENTIALS is not allowed once Schema Registry is provisioned.'
      ),
  },
  async ({ environment_id, display_name, stream_governance_package }) => {
    try {
      const body: Record<string, unknown> = {};
      if (display_name) {
        body.display_name = display_name;
      }
      if (stream_governance_package) {
        body.stream_governance = { package: stream_governance_package };
      }
      const result = await getClient().patch(
        `/org/v2/environments/${environment_id}`,
        body
      );
      return ok(result);
    } catch (error) {
      return fail(error);
    }
  }
);

// --- delete_environment ---

server.tool(
  "delete_environment",
  "Delete a Confluent Cloud environment. WARNING: All clusters and resources in the environment must be deleted first.",
  {
    environment_id: z
      .string()
      .describe("The environment ID to delete (e.g., env-abc123)"),
  },
  async ({ environment_id }) => {
    try {
      await getClient().delete(`/org/v2/environments/${environment_id}`);
      return ok({ deleted: true, environment_id });
    } catch (error) {
      return fail(error);
    }
  }
);

// ============================================================
// Clusters
// ============================================================

// --- create_cluster ---

server.tool(
  "create_cluster",
  "Create a new Kafka cluster in a Confluent Cloud environment. Returns immediately with a cluster ID — the cluster will be in PROVISIONING status. Use get_cluster to poll until status is PROVISIONED.",
  {
    display_name: z.string().describe("A human-readable name for the cluster"),
    environment_id: z
      .string()
      .describe("The environment ID (e.g., env-abc123) to create the cluster in"),
    cloud: z.enum(["AWS", "GCP", "AZURE"]).describe("Cloud provider for the cluster"),
    region: z
      .string()
      .describe(
        "Cloud region for the cluster. Common regions — AWS: us-east-1, us-west-2, eu-west-1, eu-central-1, ap-southeast-1; GCP: us-east1, us-west1, europe-west1; Azure: eastus, westus2, westeurope."
      ),
    availability: z
      .enum(["SINGLE_ZONE", "MULTI_ZONE"])
      .optional()
      .describe("Availability type. Defaults to SINGLE_ZONE."),
    cluster_type: z
      .enum(["BASIC", "STANDARD", "DEDICATED", "ENTERPRISE", "FREIGHT"])
      .optional()
      .describe("Cluster type. BASIC is cheapest and good for dev/test. Defaults to BASIC."),
  },
  async ({ display_name, environment_id, cloud, region, availability, cluster_type }) => {
    try {
      const type = cluster_type ?? "BASIC";
      const kindMap: Record<string, string> = {
        BASIC: "Basic",
        STANDARD: "Standard",
        DEDICATED: "Dedicated",
        ENTERPRISE: "Enterprise",
        FREIGHT: "Freight",
      };
      const specConfig: Record<string, unknown> = { kind: kindMap[type] ?? "Basic" };
      if (type === "DEDICATED") {
        specConfig.cku = 1;
      }
      const body = {
        spec: {
          display_name,
          availability: availability ?? "SINGLE_ZONE",
          cloud,
          region,
          config: specConfig,
          environment: { id: environment_id, environment: environment_id },
        },
      };
      const result = await getClient().post("/cmk/v2/clusters", body);
      return ok(result);
    } catch (error) {
      return fail(error);
    }
  }
);

// --- get_cluster ---

server.tool(
  "get_cluster",
  "Get details of a Kafka cluster including its provisioning status. Use this to poll until a newly created cluster reaches PROVISIONED status. The status is in the response at status.phase.",
  {
    cluster_id: z.string().describe("The cluster ID (e.g., lkc-abc123)"),
    environment_id: z
      .string()
      .describe("The environment ID (e.g., env-abc123) the cluster belongs to"),
  },
  async ({ cluster_id, environment_id }) => {
    try {
      const result = await getClient().get(
        `/cmk/v2/clusters/${cluster_id}?environment=${environment_id}`
      );
      return ok(result);
    } catch (error) {
      return fail(error);
    }
  }
);

// --- list_clusters ---

server.tool(
  "list_clusters",
  "List all Kafka clusters in a Confluent Cloud environment. Returns cluster IDs, names, cloud/region, type, and status.",
  {
    environment_id: z
      .string()
      .describe("The environment ID (e.g., env-abc123) to list clusters for"),
  },
  async ({ environment_id }) => {
    try {
      const result = await getClient().listAll(
        `/cmk/v2/clusters?environment=${environment_id}`
      );
      return ok(result);
    } catch (error) {
      return fail(error);
    }
  }
);

// --- delete_cluster ---

server.tool(
  "delete_cluster",
  "Delete a Kafka cluster from a Confluent Cloud environment. This is irreversible — all topics and data in the cluster will be lost.",
  {
    cluster_id: z.string().describe("The cluster ID to delete (e.g., lkc-abc123)"),
    environment_id: z
      .string()
      .describe("The environment ID (e.g., env-abc123) the cluster belongs to"),
  },
  async ({ cluster_id, environment_id }) => {
    try {
      await getClient().delete(
        `/cmk/v2/clusters/${cluster_id}?environment=${environment_id}`
      );
      return ok({ deleted: true, cluster_id });
    } catch (error) {
      return fail(error);
    }
  }
);

// ============================================================
// API Keys
// ============================================================

// --- create_api_key ---

server.tool(
  "create_api_key",
  "Create a cluster-scoped API key for a Kafka cluster. Required for data plane operations (creating topics, producing, consuming). IMPORTANT: The API secret is only shown once — save it immediately.",
  {
    display_name: z.string().describe("A human-readable name for the API key"),
    description: z.string().optional().describe("Description of the API key's purpose"),
    environment_id: z.string().describe("The environment ID (e.g., env-abc123)"),
    cluster_id: z
      .string()
      .describe("The cluster ID (e.g., lkc-abc123) to scope the key to"),
  },
  async ({ display_name, description, environment_id, cluster_id }) => {
    try {
      const apiKey = process.env.CONFLUENT_CLOUD_API_KEY;
      if (!apiKey) {
        throw new Error("Missing CONFLUENT_CLOUD_API_KEY environment variable");
      }
      const keyMeta = await getClient().get<{
        spec: { owner: { id: string; api_version: string; kind: string } };
      }>(`/iam/v2/api-keys/${apiKey}`);
      const owner = keyMeta.spec.owner;

      const body = {
        spec: {
          display_name,
          description: description ?? "",
          owner: {
            id: owner.id,
            api_version: owner.api_version,
            kind: owner.kind,
          },
          resource: {
            id: cluster_id,
            environment: environment_id,
          },
        },
      };
      const result = await getClient().post<{
        id: string;
        spec: {
          secret: string;
          display_name: string;
          resource: { id: string; kind: string };
        };
      }>("/iam/v2/api-keys", body);
      try {
        await saveApiKey(
          cluster_id,
          result.id,
          result.spec.secret,
          result.spec.resource?.kind ?? "Cluster",
          result.spec.display_name
        );
      } catch {
        // best-effort — don't fail the key creation if context save fails
      }
      return ok(result);
    } catch (error) {
      return fail(error);
    }
  }
);

// --- list_api_keys ---

server.tool(
  "list_api_keys",
  "List API keys in the organization. Optionally filter by cluster resource ID to find keys scoped to a specific cluster.",
  {
    resource_id: z
      .string()
      .optional()
      .describe(
        "Optional cluster ID (e.g., lkc-abc123) to filter keys scoped to that resource"
      ),
  },
  async ({ resource_id }) => {
    try {
      const path = resource_id
        ? `/iam/v2/api-keys?spec.resource=${resource_id}`
        : "/iam/v2/api-keys";
      const result = await getClient().listAll(path);
      return ok(result);
    } catch (error) {
      return fail(error);
    }
  }
);

// --- delete_api_key ---

server.tool(
  "delete_api_key",
  "Delete an API key. This is irreversible — any applications using this key will lose access immediately.",
  {
    api_key_id: z
      .string()
      .describe("The API key ID to delete (e.g., the key string like ABCDEFGHIJKLMNOP)"),
  },
  async ({ api_key_id }) => {
    try {
      await getClient().delete(`/iam/v2/api-keys/${api_key_id}`);
      try {
        await removeApiKey(api_key_id);
      } catch {
        // best-effort — don't fail the deletion if context update fails
      }
      return ok({ deleted: true, api_key_id });
    } catch (error) {
      return fail(error);
    }
  }
);

// ============================================================
// Topics (data plane — requires cluster-scoped API credentials)
// ============================================================

// --- create_topic ---

server.tool(
  "create_topic",
  "Create a Kafka topic in a Confluent Cloud cluster. Cluster API credentials are auto-resolved from .confluent-context.json if not provided. Use create_api_key first to get cluster credentials.",
  {
    cluster_id: z.string().describe("The cluster ID (e.g., lkc-abc123)"),
    environment_id: z
      .string()
      .describe("The environment ID (e.g., env-abc123) the cluster belongs to"),
    cluster_api_key: z
      .string()
      .optional()
      .describe("Cluster-scoped API key (from create_api_key). Auto-resolved from context if omitted."),
    cluster_api_secret: z
      .string()
      .optional()
      .describe("Cluster-scoped API secret (from create_api_key). Auto-resolved from context if omitted."),
    topic_name: z.string().describe("Name of the topic to create"),
    partitions_count: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Number of partitions. Defaults to 6."),
    retention_ms: z
      .number()
      .int()
      .optional()
      .describe(
        "Retention time in milliseconds. Defaults to 604800000 (7 days). Set to -1 for infinite."
      ),
  },
  async ({
    cluster_id,
    environment_id,
    cluster_api_key,
    cluster_api_secret,
    topic_name,
    partitions_count,
    retention_ms,
  }) => {
    try {
      const creds = await resolveClusterCredentials(cluster_id, cluster_api_key, cluster_api_secret);
      const topicBody: Record<string, unknown> = {
        topic_name,
        partitions_count: partitions_count ?? 6,
      };
      if (retention_ms !== undefined) {
        topicBody.configs = [
          { name: "retention.ms", value: String(retention_ms) },
        ];
      }
      const result = await withClusterRestApi(
        cluster_id,
        environment_id,
        creds.api_key,
        creds.api_secret,
        "POST",
        `/kafka/v3/clusters/${cluster_id}/topics`,
        topicBody
      );
      return ok(result ?? { topic_name });
    } catch (error) {
      return fail(error);
    }
  }
);

// --- list_topics ---

server.tool(
  "list_topics",
  "List all topics in a Kafka cluster. Cluster API credentials are auto-resolved from .confluent-context.json if not provided.",
  {
    cluster_id: z.string().describe("The cluster ID (e.g., lkc-abc123)"),
    environment_id: z
      .string()
      .describe("The environment ID (e.g., env-abc123) the cluster belongs to"),
    cluster_api_key: z
      .string()
      .optional()
      .describe("Cluster-scoped API key (from create_api_key). Auto-resolved from context if omitted."),
    cluster_api_secret: z
      .string()
      .optional()
      .describe("Cluster-scoped API secret (from create_api_key). Auto-resolved from context if omitted."),
  },
  async ({ cluster_id, environment_id, cluster_api_key, cluster_api_secret }) => {
    try {
      const creds = await resolveClusterCredentials(cluster_id, cluster_api_key, cluster_api_secret);
      const result = await withClusterRestApi(
        cluster_id,
        environment_id,
        creds.api_key,
        creds.api_secret,
        "GET",
        `/kafka/v3/clusters/${cluster_id}/topics`
      );
      return ok(result);
    } catch (error) {
      return fail(error);
    }
  }
);

// --- delete_topic ---

server.tool(
  "delete_topic",
  "Delete a Kafka topic from a cluster. This is irreversible — all messages in the topic will be lost. Cluster API credentials are auto-resolved from .confluent-context.json if not provided.",
  {
    cluster_id: z.string().describe("The cluster ID (e.g., lkc-abc123)"),
    environment_id: z
      .string()
      .describe("The environment ID (e.g., env-abc123) the cluster belongs to"),
    cluster_api_key: z
      .string()
      .optional()
      .describe("Cluster-scoped API key (from create_api_key). Auto-resolved from context if omitted."),
    cluster_api_secret: z
      .string()
      .optional()
      .describe("Cluster-scoped API secret (from create_api_key). Auto-resolved from context if omitted."),
    topic_name: z.string().describe("Name of the topic to delete"),
  },
  async ({
    cluster_id,
    environment_id,
    cluster_api_key,
    cluster_api_secret,
    topic_name,
  }) => {
    try {
      const creds = await resolveClusterCredentials(cluster_id, cluster_api_key, cluster_api_secret);
      await withClusterRestApi(
        cluster_id,
        environment_id,
        creds.api_key,
        creds.api_secret,
        "DELETE",
        `/kafka/v3/clusters/${cluster_id}/topics/${topic_name}`
      );
      return ok({ deleted: true, topic_name });
    } catch (error) {
      return fail(error);
    }
  }
);

// --- Start server ---

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
