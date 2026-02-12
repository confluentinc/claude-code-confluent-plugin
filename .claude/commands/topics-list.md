---
description: List all topics in a Kafka cluster
allowed-tools: mcp__confluent-infra__list_environments, mcp__confluent-infra__list_clusters, mcp__confluent-infra__list_api_keys, mcp__confluent-infra__create_api_key, mcp__confluent-infra__list_topics
---

**Before starting:** If any tool call fails with "Missing required environment variables", tell the user:
"Set your Confluent Cloud API credentials — generate at https://confluent.cloud/settings/api-keys, then `export CONFLUENT_CLOUD_API_KEY=... CONFLUENT_CLOUD_API_SECRET=...` and restart Claude Code."

List all topics in a Kafka cluster.

1. **Resolve environment** — First, read the file `.confluent-context.json` in the project root. If it exists and contains an `environment_id`, use that environment automatically and tell me: "Using active environment **{name}** (`{id}`). Run `/project:environments-use` to change."
   If the file doesn't exist or has no environment set, call `list_environments` and ask me to pick one.

2. **Pick cluster** — Call `list_clusters` for the chosen environment. Ask me to pick a cluster.

3. **Get cluster API key** — First, check `.confluent-context.json` for a stored API key for this cluster (under `api_keys[cluster_id]`). If found, use it automatically and tell me: "Using stored API key **{api_key}** for cluster `{cluster_id}`."
   If no stored key is found, call `list_api_keys` with the cluster's `resource_id` to check for existing keys.
   - If keys exist, offer to create a new one with `create_api_key` (credentials are saved automatically).
   - If no keys exist, offer to create one with `create_api_key`. Credentials are saved automatically to context.

4. **List topics** — Call `list_topics` with the cluster ID, environment ID, and cluster API credentials.

5. **Present results** — Show topics as a table:
   | Topic Name | Partitions |
   |------------|------------|

6. If no topics exist, suggest creating one with `/project:topics-create`.
