---
description: List all Kafka clusters in a Confluent Cloud environment
allowed-tools: mcp__confluent-infra__list_environments, mcp__confluent-infra__list_clusters
---

**Before starting:** If any tool call fails with "Missing required environment variables", tell the user:
"Set your Confluent Cloud API credentials — generate at https://confluent.cloud/settings/api-keys, then `export CONFLUENT_CLOUD_API_KEY=... CONFLUENT_CLOUD_API_SECRET=...` and restart Claude Code."

List all Kafka clusters in a Confluent Cloud environment.

1. **Resolve environment** — First, read the file `.confluent-context.json` in the project root. If it exists and contains an `environment_id`, use that environment automatically and tell me: "Using active environment **{name}** (`{id}`). Run `/environments-use` to change."
   If the file doesn't exist or has no environment set, call `list_environments` and ask me to pick one.

2. Call `list_clusters` for the chosen environment.

3. Present the results as a table:
   | ID | Name | Cloud | Region | Type | Status |
   |----|------|-------|--------|------|--------|

4. If no clusters exist, suggest creating one with `/clusters-create`.
