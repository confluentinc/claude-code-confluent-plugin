# Confluent Cloud Claude Code Plugin

A Claude Code plugin that lets developers build Confluent Cloud infrastructure and data streaming applications using natural language. Provides Claude Skills (slash commands) for managing environments, clusters, topics, and API keys — powered by MCP (Model Context Protocol).

## Architecture

This plugin provides a single MCP server (`confluent-infra`) with 15 tools covering full Confluent Cloud lifecycle management: infrastructure provisioning + data plane operations.

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)
- A [Confluent Cloud](https://confluent.cloud/) account with an API key

### 1. Set environment variables

Add these to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):

```bash
export CONFLUENT_CLOUD_API_KEY=your-api-key
export CONFLUENT_CLOUD_API_SECRET=your-api-secret
```

Generate API keys at [Confluent Cloud Settings > API Keys](https://confluent.cloud/settings/api-keys). Use a **Cloud resource management** API key (not a cluster-scoped key).

### 2. Add the MCP server to Claude Code

```bash
claude mcp add -s user confluent-infra \
  -e CONFLUENT_CLOUD_API_KEY=${CONFLUENT_CLOUD_API_KEY} \
  -e CONFLUENT_CLOUD_API_SECRET=${CONFLUENT_CLOUD_API_SECRET} \
  -- npx -y @confluentinc/claude-code-confluent-plugin@latest
```

This registers the plugin globally so it's available in any directory.

### 3. Install slash commands

```bash
npx @confluentinc/claude-code-confluent-plugin@latest install-commands
```

This copies the plugin's slash commands to `~/.claude/commands/` so they're available globally.

### 4. Open Claude Code

```bash
claude
```

### 5. Use the slash commands

**Environments:**
- `/environments-create` — Create a new Confluent Cloud environment
- `/environments-list` — List all environments
- `/environments-update` — Update environment name or governance package
- `/environments-use` — Set active environment for subsequent commands
- `/environments-delete` — Delete an environment

**Clusters:**
- `/clusters-create` — Create a Kafka cluster (with provisioning wait + API key creation)
- `/clusters-list` — List clusters in an environment
- `/clusters-delete` — Delete a cluster

**Topics:**
- `/topics-create` — Create a Kafka topic
- `/topics-list` — List topics in a cluster
- `/topics-delete` — Delete a topic

**API Keys:**
- `/api-keys-create` — Create a cluster-scoped API key
- `/api-keys-list` — List API keys
- `/api-keys-delete` — Delete an API key

**Setup:**
- `/setup-streaming-app` — Full end-to-end: environment → cluster → API key → topics → optional app scaffold

## MCP Tools

### Management Plane

| Tool | Description |
|------|-------------|
| `create_environment` | Create a Confluent Cloud environment |
| `list_environments` | List all environments |
| `update_environment` | Update environment name or governance package |
| `delete_environment` | Delete an environment |
| `create_cluster` | Create a Kafka cluster (returns immediately, async provisioning) |
| `get_cluster` | Get cluster details and provisioning status |
| `list_clusters` | List clusters in an environment |
| `delete_cluster` | Delete a cluster |
| `create_api_key` | Create a cluster-scoped API key |
| `list_api_keys` | List API keys (optional resource filter) |
| `delete_api_key` | Delete an API key |

### Data Plane (requires cluster-scoped API credentials)

| Tool | Description |
|------|-------------|
| `create_topic` | Create a Kafka topic |
| `list_topics` | List all topics in a cluster |
| `delete_topic` | Delete a topic |

## Configuration

The `claude mcp add` command in [Step 2](#2-add-the-mcp-server-to-claude-code) registers the MCP server in your user-level Claude Code settings (`~/.claude.json`), making it available from any directory.

## Development

```bash
# Install dependencies
npm install

# Build (cleans dist/ first)
npm run build

# Watch mode
npm run dev
```

## License

Confluent Community License Agreement