# Confluent Cloud Claude Code Plugin

Claude-first interface for provisioning and managing Confluent Cloud infrastructure via MCP.

## Auth Model

Two credential layers:

| Layer | Credentials | Source | Used For |
|-------|------------|--------|----------|
| **Management plane** | Cloud API key/secret | `CONFLUENT_CLOUD_API_KEY` / `CONFLUENT_CLOUD_API_SECRET` env vars | Environments, clusters, API keys |
| **Data plane** | Cluster-scoped API key/secret | Auto-resolved from `.confluent-context.json`, or passed as tool parameters | Topics (create, list, delete) |

Generate Cloud API keys at https://confluent.cloud/settings/api-keys (use "Cloud resource management" type).

## API Key Storage

Cluster-scoped API keys are automatically saved to `.confluent-context.json` when created via `create_api_key`, and removed when deleted via `delete_api_key`. Data plane tools (`create_topic`, `list_topics`, `delete_topic`) auto-resolve credentials from this file when `cluster_api_key`/`cluster_api_secret` are not explicitly provided.

Keys are stored by `resource_id` (one key per resource, newest overwrites):

```json
{
  "environment_id": "env-abc123",
  "environment_name": "production",
  "api_keys": {
    "lkc-abc123": {
      "api_key": "ABCDEFGHIJKLMNOP",
      "api_secret": "cflt...",
      "resource_kind": "Cluster",
      "display_name": "my-kafka-cluster-key",
      "created_at": "2026-02-12T19:10:37Z"
    }
  }
}
```

## Tools (15 total)

### Management Plane (via Confluent Cloud REST API)

| Tool | Description |
|------|-------------|
| `create_environment` | Create a new environment |
| `list_environments` | List all environments |
| `update_environment` | Update environment name or governance package |
| `delete_environment` | Delete an environment (must be empty) |
| `create_cluster` | Create a Kafka cluster (async — returns PROVISIONING) |
| `get_cluster` | Get cluster details / poll provisioning status |
| `list_clusters` | List clusters in an environment |
| `delete_cluster` | Delete a cluster (irreversible) |
| `create_api_key` | Create a cluster-scoped API key |
| `list_api_keys` | List API keys (optional resource filter) |
| `delete_api_key` | Delete an API key |

### Data Plane (via Kafka REST API, cluster-scoped credentials)

| Tool | Description |
|------|-------------|
| `create_topic` | Create a topic (default 6 partitions, 7d retention) |
| `list_topics` | List all topics in a cluster |
| `delete_topic` | Delete a topic (irreversible) |

## Slash Commands

| Command | Description |
|---------|-------------|
| `/environments-create` | Create environment with governance options |
| `/environments-list` | List all environments |
| `/environments-use` | Set active environment for subsequent commands |
| `/environments-update` | Update environment name or governance package |
| `/environments-delete` | Delete environment (checks for clusters first) |
| `/clusters-create` | Create cluster + wait + API key |
| `/clusters-list` | List clusters in an environment |
| `/clusters-delete` | Delete a cluster |
| `/topics-create` | Create topic (auto-resolves cluster API key) |
| `/topics-list` | List topics in a cluster |
| `/topics-delete` | Delete a topic |
| `/api-keys-create` | Create cluster-scoped API key |
| `/api-keys-list` | List API keys |
| `/api-keys-delete` | Delete an API key |
| `/setup-streaming-app` | End-to-end: env → cluster → key → topics → app scaffold |

## Common Cloud Regions

| AWS | GCP | Azure |
|-----|-----|-------|
| us-east-1 | us-east1 | eastus |
| us-west-2 | us-west1 | westus2 |
| eu-west-1 | europe-west1 | westeurope |
| eu-central-1 | europe-west2 | southeastasia |
| ap-southeast-1 | asia-southeast1 | |
| ap-southeast-2 | | |

## Error Recovery

| Error | Cause | Fix |
|-------|-------|-----|
| "Missing required environment variables" | Cloud API key not set | `export CONFLUENT_CLOUD_API_KEY=... CONFLUENT_CLOUD_API_SECRET=...` and restart Claude Code |
| "Cluster does not have a REST endpoint yet" | Cluster still provisioning | Poll `get_cluster` until status is PROVISIONED |
| HTTP 401 on topic operations | Wrong or expired cluster API key | Create a new cluster-scoped key with `create_api_key` |
| "environment must be empty" on delete | Clusters still exist | Delete all clusters first with `delete_cluster` |
| HTTP 409 on topic create | Topic already exists | Choose a different name or delete existing topic |
| "No cluster API credentials provided and none found" | No stored key for this cluster | Create a cluster-scoped key with `create_api_key` (it will be saved automatically) |

## Build

```bash
npm install && npm run build
```

The `prebuild` script cleans `dist/` automatically. Output goes to `dist/index.js`.

## API Documentation

- Confluent Cloud REST API: https://docs.confluent.io/cloud/current/api.html
- Kafka REST API v3: https://docs.confluent.io/cloud/current/api.html#tag/Topic-(v3)
