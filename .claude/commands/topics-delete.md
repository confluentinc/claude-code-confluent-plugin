---
description: Delete a Kafka topic from a cluster
allowed-tools: mcp__confluent-infra__list_environments, mcp__confluent-infra__list_clusters, mcp__confluent-infra__list_api_keys, mcp__confluent-infra__create_api_key, mcp__confluent-infra__list_topics, mcp__confluent-infra__delete_topic
---

**Before starting:** If any tool call fails with "Missing required environment variables", tell the user:
"Set your Confluent Cloud API credentials — generate at https://confluent.cloud/settings/api-keys, then `export CONFLUENT_CLOUD_API_KEY=... CONFLUENT_CLOUD_API_SECRET=...` and restart Claude Code."

Help me delete a Kafka topic from a cluster.

Follow these steps:

1. **Resolve environment** — First, read the file `.confluent-context.json` in the project root. If it exists and contains an `environment_id`, use that environment automatically and tell me: "Using active environment **{name}** (`{id}`). Run `/environments-use` to change."
   If the file doesn't exist or has no environment set, call `list_environments` and ask me to pick one.

2. **Pick cluster** — Call `list_clusters` for the chosen environment. Ask me to pick a cluster.

3. **Get cluster API key** — First, check `.confluent-context.json` for a stored API key for this cluster (under `api_keys[cluster_id]`). If found, use it automatically and tell me: "Using stored API key **{api_key}** for cluster `{cluster_id}`."
   If no stored key is found, call `list_api_keys` with the cluster's `resource_id` to check for existing keys.
   - If keys exist, offer to create a new one with `create_api_key` (credentials are saved automatically).
   - If no keys exist, offer to create one with `create_api_key`. Credentials are saved automatically to context.

4. **List topics** — Call `list_topics` to show existing topics. Present as a numbered list.

5. Ask me to pick the topic to delete.

6. **WARNING:** Warn that deleting a topic is irreversible — all messages will be lost.

7. Ask for explicit confirmation: "Are you sure you want to delete topic **{name}**? This cannot be undone."

8. Once confirmed, call `delete_topic` with the cluster ID, environment ID, cluster API credentials, and topic name.

9. Confirm deletion was successful.
