---
description: Delete a Confluent Cloud environment
allowed-tools: mcp__confluent-infra__list_environments, mcp__confluent-infra__delete_environment, mcp__confluent-infra__list_clusters
---

**Before starting:** If any tool call fails with "Missing required environment variables", tell the user:
"Set your Confluent Cloud API credentials — generate at https://confluent.cloud/settings/api-keys, then `export CONFLUENT_CLOUD_API_KEY=... CONFLUENT_CLOUD_API_SECRET=...` and restart Claude Code."

Help me delete a Confluent Cloud environment.

Follow these steps:

1. **Resolve environment** — First, read the file `.confluent-context.json` in the project root. If it exists and contains an `environment_id`, offer that as the default but still call `list_environments` to show all options (since deletion is destructive, always confirm which one).

2. Ask me to pick the environment to delete.

3. **WARNING:** Before deleting, warn me that all clusters and resources in the environment must be deleted first. Call `list_clusters` for the selected environment to check for existing clusters.
   - If clusters exist, list them and tell me to delete them first using `/clusters-delete`.
   - If no clusters exist, proceed.

4. Ask for explicit confirmation: "Are you sure you want to delete environment **{name}** (`{id}`)? This cannot be undone."

5. Once confirmed, call `delete_environment` with the environment ID.

6. Confirm deletion was successful.
