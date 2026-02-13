---
description: Update an existing Confluent Cloud environment
allowed-tools: mcp__confluent-infra__list_environments, mcp__confluent-infra__update_environment
---

**Before starting:** If any tool call fails with "Missing required environment variables", tell the user:
"Set your Confluent Cloud API credentials — generate at https://confluent.cloud/settings/api-keys, then `export CONFLUENT_CLOUD_API_KEY=... CONFLUENT_CLOUD_API_SECRET=...` and restart Claude Code."

Help me update an existing Confluent Cloud environment.

## Step 1: Resolve environment

Read the file `.confluent-context.json` in the project root. If it exists and has an `environment_id`, offer to update that environment by default. Otherwise, call `list_environments` and ask me to pick one.

## Step 2: Gather changes

Use the `AskUserQuestion` tool to present an interactive form:

**Question 1 — What to update** (header: "Update", multiSelect: true)
- Option 1: "Rename" (description: "Change the environment display name")
- Option 2: "Stream Governance" (description: "Change governance package. Note: downgrading from Advanced to Essentials is not allowed once Schema Registry is provisioned.")

Then, based on selections, ask follow-up questions using `AskUserQuestion`:

**If Rename selected** — ask for the new name (free text via "Other")

**If Stream Governance selected:**
- Option 1: "Essentials" (description: "Free to start, $0.002/schema/hr after 100 free schemas")
- Option 2: "Advanced" (description: "$1/hr, $0/schema/hr with up to 20k schemas. Enterprise-ready governance.")

## Step 3: Confirm and update

Summarize the changes and call `update_environment` with the environment ID and updated fields.

## Step 4: Show result

Display:
- Environment ID
- Updated display name
- Stream governance package
