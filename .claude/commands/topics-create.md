---
description: Create a Kafka topic in a Confluent Cloud cluster
allowed-tools: mcp__confluent-infra__list_environments, mcp__confluent-infra__list_clusters, mcp__confluent-infra__list_api_keys, mcp__confluent-infra__create_api_key, mcp__confluent-infra__create_topic
---

**Before starting:** If any tool call fails with "Missing required environment variables", tell the user:
"Set your Confluent Cloud API credentials — generate at https://confluent.cloud/settings/api-keys, then `export CONFLUENT_CLOUD_API_KEY=... CONFLUENT_CLOUD_API_SECRET=...` and restart Claude Code."

Help me create a Kafka topic in Confluent Cloud.

## Step 1: Resolve environment

Read the file `.confluent-context.json` in the project root. If it exists and contains an `environment_id`, use that environment automatically and tell me: "Using active environment **{name}** (`{id}`). Run `/project:environments-use` to change."
If the file doesn't exist or has no environment set, call `list_environments` and ask me to pick one.

## Step 2: Pick cluster

Call `list_clusters` for the chosen environment. If only one cluster exists, use it automatically. If multiple, present them and ask me to pick one. If none exist, suggest `/project:clusters-create`.

## Step 3: Resolve cluster API key

First, check `.confluent-context.json` for a stored API key for this cluster (under `api_keys[cluster_id]`). If found, use it automatically and tell me: "Using stored API key **{api_key}** for cluster `{cluster_id}`."

If no stored key is found, call `list_api_keys` with the cluster's `resource_id` to check for existing cluster-scoped API keys.
- If keys exist, offer to create a new one with `create_api_key` (credentials are saved automatically).
- If no keys exist, offer to create one with `create_api_key`. Credentials are saved automatically to context.

## Step 4: Gather topic configuration

Use the `AskUserQuestion` tool to present an interactive form in a **single call**:

**Question 1 — Topic name** (header: "Topic")
- Options: "events" (description: "General event stream"), "commands" (description: "Command/request stream"), "notifications" (description: "Notification stream")
- The user can also type a custom name (e.g., `orders.created`, `user.events`)

**Question 2 — Partitions** (header: "Partitions")
- Option 1: "6 (Recommended)" (description: "Good default for most development and production use cases")
- Option 2: "1" (description: "Single partition, useful for strict ordering")
- Option 3: "12" (description: "Higher parallelism for high-throughput topics")

**Question 3 — Retention** (header: "Retention")
- Option 1: "7 days (Recommended)" (description: "Default retention, good for most use cases")
- Option 2: "1 day" (description: "Short retention for transient data")
- Option 3: "30 days" (description: "Longer retention for replay/audit")
- Option 4: "Infinite" (description: "Never delete messages. Set retention to -1.")

## Step 5: Create the topic

Call `create_topic` with the cluster ID, environment ID, cluster API key, cluster API secret, topic name, partitions count, and retention_ms:
- 7 days = 604800000
- 1 day = 86400000
- 30 days = 2592000000
- Infinite = -1

## Step 6: Confirm creation

Show the result:
- Topic name
- Partition count
- Retention policy
- Cluster it was created on

Suggest next steps:
- "You can produce messages to this topic or create more topics"
- "List existing topics with `/project:topics-list`"
