---
description: Create a cluster-scoped API key
allowed-tools: mcp__confluent-infra__list_environments, mcp__confluent-infra__list_clusters, mcp__confluent-infra__create_api_key
---

**Before starting:** If any tool call fails with "Missing required environment variables", tell the user:
"Set your Confluent Cloud API credentials — generate at https://confluent.cloud/settings/api-keys, then `export CONFLUENT_CLOUD_API_KEY=... CONFLUENT_CLOUD_API_SECRET=...` and restart Claude Code."

Help me create a cluster-scoped API key for a Kafka cluster.

Follow these steps:

1. **Resolve environment** — First, read the file `.confluent-context.json` in the project root. If it exists and contains an `environment_id`, use that environment automatically and tell me: "Using active environment **{name}** (`{id}`). Run `/environments-use` to change."
   If the file doesn't exist or has no environment set, call `list_environments` and ask me to pick one.

2. **Pick cluster** — Call `list_clusters` for the chosen environment. Ask me to pick a cluster.

3. **Name the key** — Ask for a display name. Suggest a default like "my-app-key" or something contextual.

4. **Create the key** — Call `create_api_key` with the environment ID, cluster ID, and display name.

5. **Display the result** — Show:
   - API Key ID
   - API Secret
   - Note that credentials have been automatically saved to `.confluent-context.json` for use by topic commands.

6. **IMPORTANT:** Strongly remind me to save the API secret — it is only shown once and cannot be retrieved later! (The secret is stored in the local context file, but you should still save it separately for use outside Claude Code.)

7. Suggest next steps:
   - "Use this key to create topics with `/topics-create`"
   - "List your API keys with `/api-keys-list`"
