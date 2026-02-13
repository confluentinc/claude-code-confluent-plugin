---
description: List all Confluent Cloud environments
allowed-tools: mcp__confluent-infra__list_environments
---

**Before starting:** If any tool call fails with "Missing required environment variables", tell the user:
"Set your Confluent Cloud API credentials — generate at https://confluent.cloud/settings/api-keys, then `export CONFLUENT_CLOUD_API_KEY=... CONFLUENT_CLOUD_API_SECRET=...` and restart Claude Code."

List all Confluent Cloud environments in the organization.

1. Call `list_environments` to retrieve all environments.

2. Present the results as a table:
   | ID | Name | Stream Governance |
   |----|------|-------------------|

3. If no environments exist, suggest creating one with `/project:environments-create`.
