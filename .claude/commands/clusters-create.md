---
description: Create a new Kafka cluster in Confluent Cloud
allowed-tools: mcp__confluent-infra__list_environments, mcp__confluent-infra__create_cluster, mcp__confluent-infra__get_cluster, mcp__confluent-infra__create_api_key
---

**Before starting:** If any tool call fails with "Missing required environment variables", tell the user:
"Set your Confluent Cloud API credentials — generate at https://confluent.cloud/settings/api-keys, then `export CONFLUENT_CLOUD_API_KEY=... CONFLUENT_CLOUD_API_SECRET=...` and restart Claude Code."

Help me create a new Kafka cluster in Confluent Cloud.

## Step 1: Resolve environment

Read the file `.confluent-context.json` in the project root. If it exists and contains an `environment_id`, use that environment automatically and tell me: "Using active environment **{name}** (`{id}`). Run `/project:environments-use` to change."
If the file doesn't exist or has no environment set, call `list_environments` to show available environments. Present as a numbered list with ID and name. Ask me to pick one (or offer to create a new one with `/project:environments-create`).

## Step 2: Gather cluster configuration (part 1 — name, type, cloud)

Use the `AskUserQuestion` tool to collect name, type, and cloud provider in a **single call** with 3 questions:

**Question 1 — Cluster name** (header: "Name")
- Options: "my-kafka-cluster" (description: "Default cluster name"), "dev-cluster" (description: "Development cluster"), "prod-cluster" (description: "Production cluster")
- The user can also type a custom name

**Question 2 — Cluster type** (header: "Type")
- Option 1: "Basic" (description: "First eCKU free, then $0.14/eCKU-hr. 99.5% SLA. Great for dev/test.")
- Option 2: "Standard" (description: "$0.75/eCKU-hr. 99.9-99.99% SLA. For production workloads.")
- Option 3: "Enterprise (Coming Soon)" (description: "$1.75/eCKU-hr. Private networking, self-managed encryption.")
- Option 4: "Dedicated (Coming Soon)" (description: "$2.66/CKU-hr. Fully customizable networking and throughput.")

**Question 3 — Cloud provider** (header: "Cloud")
- Option 1: "AWS" (description: "Amazon Web Services")
- Option 2: "GCP" (description: "Google Cloud Platform")
- Option 3: "Azure" (description: "Microsoft Azure")

## Step 2b: Gather cluster configuration (part 2 — region)

After receiving the cloud provider selection, use `AskUserQuestion` with a **single question** showing regions specific to the chosen provider. The user can always type a custom region.

**If AWS selected** (header: "Region"):
- Option 1: "us-east-1" (description: "N. Virginia (default)")
- Option 2: "us-west-2" (description: "Oregon")
- Option 3: "eu-west-1" (description: "Ireland")
- Option 4: "eu-central-1" (description: "Frankfurt")

**If GCP selected** (header: "Region"):
- Option 1: "us-east1" (description: "South Carolina (default)")
- Option 2: "us-west1" (description: "Oregon")
- Option 3: "europe-west1" (description: "Belgium")
- Option 4: "europe-west2" (description: "London")

**If Azure selected** (header: "Region"):
- Option 1: "eastus" (description: "East US (default)")
- Option 2: "westus2" (description: "West US 2")
- Option 3: "westeurope" (description: "Netherlands")
- Option 4: "southeastasia" (description: "Singapore")

## Step 3: Handle special selections

**If Enterprise or Dedicated selected:** Tell the user: "Enterprise and Dedicated cluster types are **coming soon** to the Claude Code plugin. For now, you can create these through the [Confluent Cloud Console](https://confluent.cloud)." Then re-ask with only Basic and Standard as options.

**If Standard selected:** Use `AskUserQuestion` for one more question:

**Uptime SLA** (header: "SLA")
- Option 1: "99.9% (Recommended)" (description: "Single zone. Good for development or staging.")
- Option 2: "99.99%" (description: "Multi zone. Recommended for production. Minimum 2 eCKUs.")

## Step 4: Confirm and create

Show a summary in the Confluent Cloud console style:

```
Summary
─────────────────────────────
Cluster type:   Basic
Provider:       Amazon Web Services
Region:         N. Virginia (us-east-1)
Uptime SLA:     99.5%, Single zone
Networking:     Internet
Minimum eCKUs:  1
```

Ask for confirmation, then call `create_cluster` with:
- The chosen display_name
- The chosen environment_id
- The chosen cloud provider
- The chosen region
- cluster_type: "BASIC" or "STANDARD"
- availability: "SINGLE_ZONE" (or "MULTI_ZONE" if Standard with 99.99% SLA)

## Step 5: Wait for provisioning

The cluster will start in PROVISIONING status. Poll using `get_cluster` every 30 seconds until `status.phase` is `PROVISIONED`. Show progress updates. Timeout after 15 minutes.

## Step 6: Create API key

Once provisioned, automatically call `create_api_key`. The credentials are automatically saved to `.confluent-context.json` for use by topic commands. Display:
- API Key ID
- API Secret (**remind me to save this — it's only shown once!**)

## Step 7: Final summary

Show:
- Environment: name (ID)
- Cluster: name (ID)
- Cluster type & SLA
- Cloud/Region
- Bootstrap endpoint
- REST endpoint
- API Key ID (remind to save the secret)

Suggest next steps:
- "Create a topic with `/project:topics-create`"
- "Or set up a full streaming app with `/project:setup-streaming-app`"
