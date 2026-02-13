---
description: Set up a complete Confluent Cloud streaming application from scratch
allowed-tools: mcp__confluent-infra__create_environment, mcp__confluent-infra__list_environments, mcp__confluent-infra__create_cluster, mcp__confluent-infra__get_cluster, mcp__confluent-infra__create_api_key, mcp__confluent-infra__create_topic
---

**Before starting:** If any tool call fails with "Missing required environment variables", tell the user:
"Set your Confluent Cloud API credentials — generate at https://confluent.cloud/settings/api-keys, then `export CONFLUENT_CLOUD_API_KEY=... CONFLUENT_CLOUD_API_SECRET=...` and restart Claude Code."

Help me set up a complete Confluent Cloud streaming application from scratch.

This is an end-to-end workflow. Use `AskUserQuestion` interactive forms throughout to collect configuration. Walk me through each step, confirming before proceeding to the next.

## Step 1: Resolve or Create Environment

Read `.confluent-context.json` in the project root. If it has an `environment_id`, use `AskUserQuestion` to ask:

**Use existing environment?** (header: "Environment")
- Option 1: "Use {name} ({id})" (description: "Continue with the active environment")
- Option 2: "Create new" (description: "Set up a fresh environment")

If creating new, use `AskUserQuestion`:

**Question 1 — Environment name** (header: "Name")
- Options: "development" (description: "Good for testing"), "staging" (description: "Pre-production"), "production" (description: "Production workloads")

**Question 2 — Stream Governance** (header: "Governance")
- Option 1: "Essentials" (description: "Free to start, $0.002/schema/hr after 100 free schemas")
- Option 2: "Advanced (Recommended)" (description: "$1/hr. Enterprise-ready governance with up to 20k schemas")

Call `create_environment` and save to `.confluent-context.json`.

## Step 2: Create Kafka Cluster

Use `AskUserQuestion` to collect all cluster options in a **single call**:

**Question 1 — Cluster name** (header: "Name")
- Options: "my-kafka-cluster" (description: "Default name"), "dev-cluster" (description: "Development"), "prod-cluster" (description: "Production")

**Question 2 — Cloud provider** (header: "Cloud")
- Option 1: "AWS" (description: "Amazon Web Services")
- Option 2: "GCP" (description: "Google Cloud Platform")
- Option 3: "Azure" (description: "Microsoft Azure")

**Question 3 — Region** (header: "Region")
- Option 1: "us-east-1" (description: "N. Virginia (AWS default)")
- Option 2: "us-west-2" (description: "Oregon")
- Option 3: "eu-west-1" (description: "Ireland")

Adapt region options based on cloud provider selection. Call `create_cluster` with type BASIC, SINGLE_ZONE.

Poll `get_cluster` every 30 seconds until PROVISIONED (timeout 15 minutes). Show progress.

## Step 3: Create API Key

Once cluster is provisioned, call `create_api_key` automatically. Credentials are automatically saved to `.confluent-context.json` for use by topic commands.
- Display API Key and Secret
- **Strongly remind to save the secret — it's only shown once!** (The secret is stored in the local context file, but save it separately for use outside Claude Code.)

## Step 4: Create Topics

Use `AskUserQuestion`:

**Question 1 — Topics** (header: "Topics", multiSelect: true)
- Option 1: "events" (description: "General event stream")
- Option 2: "commands" (description: "Command/request stream")
- Option 3: "notifications" (description: "Notification stream")
- The user can also type custom topic names

For each topic, call `create_topic` with 6 partitions and 7-day retention by default. Cluster API credentials are auto-resolved from context — no need to pass them explicitly.

## Step 5: Scaffold Application (Optional)

Use `AskUserQuestion`:

**Scaffold a starter app?** (header: "Scaffold")
- Option 1: "Node.js / TypeScript" (description: "Producer + consumer using kafkajs")
- Option 2: "Python" (description: "Producer + consumer using confluent-kafka")
- Option 3: "Java" (description: "Producer + consumer using Kafka client")
- Option 4: "Skip" (description: "No application scaffolding needed")

If not skipped, create producer + consumer files with:
- Connection config pointing to the new cluster
- Placeholder for API key/secret (reference environment variables)
- Basic error handling and comments

## Step 6: Summary

Show a final summary:

```
Confluent Cloud Streaming App — Setup Complete

Environment:  <name> (<env-id>)
Cluster:      <name> (<cluster-id>)
Cloud/Region: <cloud> / <region>
Type:         Basic (Single Zone)

Endpoints:
  Bootstrap:  <bootstrap-url>
  REST:       <rest-endpoint>

API Key:      <key-id> (secret was shown above — make sure you saved it!)

Topics:
  - <topic-1> (6 partitions)
  - <topic-2> (6 partitions)

Application files: (if scaffolded)
  - producer.<ext>
  - consumer.<ext>
```

Suggest what to do next:
- "Run the producer to send test messages"
- "Open the Confluent Cloud console to monitor your cluster"
- "Create additional topics with `/project:topics-create`"
