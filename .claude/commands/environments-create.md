---
description: Create a new Confluent Cloud environment
allowed-tools: mcp__confluent-infra__create_environment, mcp__confluent-infra__list_environments
---

**Before starting:** If any tool call fails with "Missing required environment variables", tell the user:
"Set your Confluent Cloud API credentials — generate at https://confluent.cloud/settings/api-keys, then `export CONFLUENT_CLOUD_API_KEY=... CONFLUENT_CLOUD_API_SECRET=...` and restart Claude Code."

Help me create a new Confluent Cloud environment.

## Step 1: Gather configuration

Use the `AskUserQuestion` tool to present an interactive form with these questions in a **single call**:

**Question 1 — Environment name** (header: "Name")
- Options: "development" (description: "Good for testing and experimentation"), "staging" (description: "Pre-production environment"), "production" (description: "Production workloads")
- The user can also type a custom name

**Question 2 — Stream Governance package** (header: "Governance")
- Option 1: "Essentials (Default)" (description: "Free to start, $0.002/schema/hr after 100 free schemas. Includes Schema Registry.")
- Option 2: "Advanced (Recommended)" (description: "$1/hr, $0/schema/hr with up to 20k schemas. Enterprise-ready governance.")

## Step 2: Create the environment

Once the user submits the form, call `create_environment` with:
- `display_name`: the chosen name
- `stream_governance_package`: "ESSENTIALS" if Essentials selected, "ADVANCED" if Advanced selected

## Step 3: Show result

Display:
- Environment ID (e.g., `env-abc123`)
- Display name
- Stream governance package

Suggest next steps:
- "You can now create a Kafka cluster in this environment using `/project:clusters-create`"
- "Set this as your active environment with `/project:environments-use`"
