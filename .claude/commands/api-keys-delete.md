---
description: Delete an API key
allowed-tools: mcp__confluent-infra__list_api_keys, mcp__confluent-infra__delete_api_key
---

**Before starting:** If any tool call fails with "Missing required environment variables", tell the user:
"Set your Confluent Cloud API credentials — generate at https://confluent.cloud/settings/api-keys, then `export CONFLUENT_CLOUD_API_KEY=... CONFLUENT_CLOUD_API_SECRET=...` and restart Claude Code."

Help me delete an API key.

Follow these steps:

1. Call `list_api_keys` to show existing keys as a numbered list with Key ID, display name, and resource.

2. Ask me to pick the key to delete.

3. **WARNING:** Warn that deleting an API key is irreversible — any applications using this key will lose access immediately.

4. Ask for explicit confirmation: "Are you sure you want to delete API key **{key_id}**? This cannot be undone."

5. Once confirmed, call `delete_api_key` with the key ID. The key is automatically removed from `.confluent-context.json` as well.

6. Confirm deletion was successful.
