---
description: Delete a Kafka cluster from Confluent Cloud
allowed-tools: mcp__confluent-infra__list_environments, mcp__confluent-infra__list_clusters, mcp__confluent-infra__delete_cluster
---

**Before starting:** If any tool call fails with "Missing required environment variables", tell the user:
"Set your Confluent Cloud API credentials — generate at https://confluent.cloud/settings/api-keys, then `export CONFLUENT_CLOUD_API_KEY=... CONFLUENT_CLOUD_API_SECRET=...` and restart Claude Code."

Help me delete a Kafka cluster from Confluent Cloud.

Follow these steps:

1. **Resolve environment** — First, read the file `.confluent-context.json` in the project root. If it exists and contains an `environment_id`, use that environment automatically and tell me: "Using active environment **{name}** (`{id}`). Run `/project:environments-use` to change."
   If the file doesn't exist or has no environment set, call `list_environments` and ask me to pick one.

2. Call `list_clusters` for the chosen environment. Show clusters as a numbered list with ID, name, and status.

3. Ask me to pick the cluster to delete.

4. **WARNING:** Warn that deleting a cluster is irreversible — all topics and data will be lost.

5. Ask for explicit confirmation: "Are you sure you want to delete cluster **{name}** (`{id}`)? This cannot be undone."

6. Once confirmed, call `delete_cluster` with the cluster ID and environment ID.

7. Confirm deletion was successful.
