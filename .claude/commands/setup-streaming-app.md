---
description: Set up a complete Confluent Cloud streaming application from scratch
allowed-tools: mcp__confluent-infra__create_environment, mcp__confluent-infra__list_environments, mcp__confluent-infra__create_cluster, mcp__confluent-infra__get_cluster, mcp__confluent-infra__list_clusters, mcp__confluent-infra__create_api_key, mcp__confluent-infra__list_api_keys, mcp__confluent-infra__create_topic
---

**Before starting:** If any tool call fails with "Missing required environment variables", tell the user:
"Set your Confluent Cloud API credentials — generate at https://confluent.cloud/settings/api-keys, then `export CONFLUENT_CLOUD_API_KEY=... CONFLUENT_CLOUD_API_SECRET=...` and restart Claude Code."

Help me set up a complete Confluent Cloud streaming application from scratch.

This is an end-to-end workflow. Use `AskUserQuestion` interactive forms throughout to collect configuration. Walk me through each step, confirming before proceeding to the next.

## Step 1: Resolve or Create Environment

Read `.confluent-context.json` in the project root. If it has an `environment_id`, use `AskUserQuestion` to ask:

**Use existing environment?** (header: "Environment")
- Option 1: "Use {name} ({id})" (description: "Continue with the active environment")
- Option 2: "Create new" (description: "Set up a fresh environment")

If creating new, use `AskUserQuestion` in a **single call**:

**Question 1 — Environment name** (header: "Name")
- Options: "development" (description: "Good for testing and experimentation"), "staging" (description: "Pre-production environment"), "production" (description: "Production workloads")
- The user can also type a custom name

**Question 2 — Stream Governance package** (header: "Governance")
- Option 1: "Essentials (Default)" (description: "Free to start, $0.002/schema/hr after 100 free schemas. Includes Schema Registry.")
- Option 2: "Advanced (Recommended)" (description: "$1/hr, $0/schema/hr with up to 20k schemas. Enterprise-ready governance.")

Call `create_environment` with:
- `display_name`: the chosen name
- `stream_governance_package`: "ESSENTIALS" if Essentials selected, "ADVANCED" if Advanced selected

Display the Environment ID, name, and governance package. Save to `.confluent-context.json`.

## Step 2: Create Kafka Cluster

### Step 2a: Gather cluster configuration (part 1 — name, type, cloud)

Use the `AskUserQuestion` tool to collect name, type, and cloud provider in a **single call** with 3 questions:

**Question 1 — Cluster name** (header: "Name")
- Options: "my-kafka-cluster" (description: "Default cluster name"), "dev-cluster" (description: "Development cluster"), "prod-cluster" (description: "Production cluster")
- The user can also type a custom name

**Question 2 — Cluster type** (header: "Type")
- Option 1: "Basic" (description: "First eCKU free, then $0.14/eCKU-hr. 99.5% SLA. Great for dev/test.")
- Option 2: "Standard" (description: "$0.75/eCKU-hr. 99.9-99.99% SLA. For production workloads.")
- Option 3: "Enterprise (Coming Soon)" (description: "$1.75/eCKU-hr. Private networking, self-managed encryption.")
- Option 4: "Dedicated (Coming Soon)" (description: "$2.66/CKU-hr. Fully customizable networking and throughput.")

**Question 3 — Cloud provider** (header: "Cloud")
- Option 1: "AWS" (description: "Amazon Web Services")
- Option 2: "GCP" (description: "Google Cloud Platform")
- Option 3: "Azure" (description: "Microsoft Azure")

### Step 2b: Gather cluster configuration (part 2 — region)

After receiving the cloud provider selection, use `AskUserQuestion` with a **single question** showing regions specific to the chosen provider. The user can always type a custom region.

**If AWS selected** (header: "Region"):
- Option 1: "us-east-1" (description: "N. Virginia (default)")
- Option 2: "us-west-2" (description: "Oregon")
- Option 3: "eu-west-1" (description: "Ireland")
- Option 4: "eu-central-1" (description: "Frankfurt")

**If GCP selected** (header: "Region"):
- Option 1: "us-east1" (description: "South Carolina (default)")
- Option 2: "us-west1" (description: "Oregon")
- Option 3: "europe-west1" (description: "Belgium")
- Option 4: "europe-west2" (description: "London")

**If Azure selected** (header: "Region"):
- Option 1: "eastus" (description: "East US (default)")
- Option 2: "westus2" (description: "West US 2")
- Option 3: "westeurope" (description: "Netherlands")
- Option 4: "southeastasia" (description: "Singapore")

### Step 2c: Handle special selections

**If Enterprise or Dedicated selected:** Tell the user: "Enterprise and Dedicated cluster types are **coming soon** to the Claude Code plugin. For now, you can create these through the [Confluent Cloud Console](https://confluent.cloud)." Then re-ask with only Basic and Standard as options.

**If Standard selected:** Use `AskUserQuestion` for one more question:

**Uptime SLA** (header: "SLA")
- Option 1: "99.9% (Recommended)" (description: "Single zone. Good for development or staging.")
- Option 2: "99.99%" (description: "Multi zone. Recommended for production. Minimum 2 eCKUs.")

### Step 2d: Confirm and create

Show a summary in the Confluent Cloud console style:

```
Summary
─────────────────────────────
Cluster type:   Basic
Provider:       Amazon Web Services
Region:         N. Virginia (us-east-1)
Uptime SLA:     99.5%, Single zone
Networking:     Internet
Minimum eCKUs:  1
```

Ask for confirmation, then call `create_cluster` with:
- The chosen display_name
- The chosen environment_id
- The chosen cloud provider
- The chosen region
- cluster_type: "BASIC" or "STANDARD"
- availability: "SINGLE_ZONE" (or "MULTI_ZONE" if Standard with 99.99% SLA)

### Step 2e: Wait for provisioning

The cluster will start in PROVISIONING status. Poll using `get_cluster` every 30 seconds until `status.phase` is `PROVISIONED`. Show progress updates. Timeout after 15 minutes.

## Step 3: Create API Key

Once cluster is provisioned, automatically call `create_api_key`. Credentials are automatically saved to `.confluent-context.json` for use by topic commands. Display:
- API Key ID
- API Secret
- Note that credentials have been saved to `.confluent-context.json`
- **Strongly remind to save the secret — it's only shown once!** (The secret is stored in the local context file, but save it separately for use outside Claude Code.)

## Step 4: Create Topics

### Step 4a: Resolve cluster API key

First, check `.confluent-context.json` for a stored API key for this cluster (under `api_keys[cluster_id]`). If found, use it automatically and tell me: "Using stored API key **{api_key}** for cluster `{cluster_id}`."

If no stored key is found, call `list_api_keys` with the cluster's `resource_id` to check for existing cluster-scoped API keys.
- If keys exist, offer to create a new one with `create_api_key` (credentials are saved automatically).
- If no keys exist, offer to create one with `create_api_key`. Credentials are saved automatically to context.

### Step 4b: Gather topic configuration

Use `AskUserQuestion` in a **single call**:

**Question 1 — Topic name** (header: "Topic")
- Option 1: "events" (description: "General event stream")
- Option 2: "commands" (description: "Command/request stream")
- Option 3: "notifications" (description: "Notification stream")
- The user can also type custom topic names (e.g., `orders.created`, `user.events`)

**Question 2 — Partitions** (header: "Partitions")
- Option 1: "6 (Recommended)" (description: "Good default for most development and production use cases")
- Option 2: "1" (description: "Single partition, useful for strict ordering")
- Option 3: "12" (description: "Higher parallelism for high-throughput topics")

**Question 3 — Retention** (header: "Retention")
- Option 1: "7 days (Recommended)" (description: "Default retention, good for most use cases")
- Option 2: "1 day" (description: "Short retention for transient data")
- Option 3: "30 days" (description: "Longer retention for replay/audit")
- Option 4: "Infinite" (description: "Never delete messages. Set retention to -1.")

### Step 4c: Create the topic(s)

Call `create_topic` with the cluster ID, environment ID, topic name, partitions count, and retention_ms:
- 7 days = 604800000
- 1 day = 86400000
- 30 days = 2592000000
- Infinite = -1

Cluster API credentials are auto-resolved from context — no need to pass them explicitly.

After creating, ask if the user wants to create additional topics. If yes, repeat Step 4b.

## Step 5: Scaffold Application (Optional)

Use `AskUserQuestion`:

**Scaffold a starter app?** (header: "Scaffold")
- Option 1: "Node.js / TypeScript" (description: "Producer + consumer using kafkajs")
- Option 2: "Python" (description: "Producer + consumer using confluent-kafka")
- Option 3: "Java" (description: "Producer + consumer using Kafka client")
- Option 4: "Skip" (description: "No application scaffolding needed")

If not skipped, create producer + consumer files with:
- Connection config pointing to the new cluster
- Placeholder for API key/secret (reference environment variables)
- Basic error handling and comments

## Step 6: Summary

Show a final summary:

```
Confluent Cloud Streaming App — Setup Complete

Environment:  <name> (<env-id>)
Cluster:      <name> (<cluster-id>)
Cloud/Region: <cloud> / <region>
Type:         <type> (<availability>)

Endpoints:
  Bootstrap:  <bootstrap-url>
  REST:       <rest-endpoint>

API Key:      <key-id> (secret was shown above — make sure you saved it!)

Topics:
  - <topic-1> (<partitions> partitions, <retention> retention)
  - <topic-2> (<partitions> partitions, <retention> retention)

Application files: (if scaffolded)
  - producer.<ext>
  - consumer.<ext>
```

Suggest what to do next:
- "Run the producer to send test messages"
- "Open the Confluent Cloud console to monitor your cluster"
- "Create additional topics with `/topics-create`"
