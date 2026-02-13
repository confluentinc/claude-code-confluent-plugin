---
description: Set the active Confluent Cloud environment for subsequent commands
allowed-tools: mcp__confluent-infra__list_environments
---

**Before starting:** If any tool call fails with "Missing required environment variables", tell the user:
"Set your Confluent Cloud API credentials — generate at https://confluent.cloud/settings/api-keys, then `export CONFLUENT_CLOUD_API_KEY=... CONFLUENT_CLOUD_API_SECRET=...` and restart Claude Code."

Help me set the active Confluent Cloud environment so I don't have to pick it every time.

Follow these steps:

1. Call `list_environments` to show available environments as a numbered list with ID and name.

2. Ask me to pick the environment I want to use as my default.

3. Read the existing `.confluent-context.json` file first (if it exists) to preserve any existing fields like `api_keys`. Then update only the `environment_id` and `environment_name` fields and write it back. If the file doesn't exist, create it with this format:
   ```json
   {
     "environment_id": "env-xxx",
     "environment_name": "my-environment"
   }
   ```

4. Confirm the active environment has been set:
   - "Active environment set to **{name}** (`{id}`)"
   - "All subsequent commands (`/clusters-create`, `/topics-create`, etc.) will use this environment automatically."
   - "To switch environments, run `/environments-use` again."
