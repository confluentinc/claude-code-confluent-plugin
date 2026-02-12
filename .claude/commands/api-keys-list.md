---
description: List API keys in the organization
allowed-tools: mcp__confluent-infra__list_api_keys
---

**Before starting:** If any tool call fails with "Missing required environment variables", tell the user:
"Set your Confluent Cloud API credentials — generate at https://confluent.cloud/settings/api-keys, then `export CONFLUENT_CLOUD_API_KEY=... CONFLUENT_CLOUD_API_SECRET=...` and restart Claude Code."

List API keys in the Confluent Cloud organization.

1. Ask me if I want to filter by a specific cluster resource ID, or list all keys.

2. Call `list_api_keys` with the optional `resource_id` filter.

3. Present the results as a table:
   | Key ID | Display Name | Owner | Resource | Created |
   |--------|-------------|-------|----------|---------|

4. If no keys exist, suggest creating one with `/project:api-keys-create`.
