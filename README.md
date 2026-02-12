# Confluent Cloud Claude Code Plugin

A Claude Code plugin that lets developers build Confluent Cloud infrastructure and data streaming applications using natural language. Provides Claude Skills (slash commands) for managing environments, clusters, topics, and API keys — powered by MCP (Model Context Protocol).

## Architecture

This plugin provides a single MCP server (`confluent-infra`) with 15 tools covering full Confluent Cloud lifecycle management: infrastructure provisioning + data plane operations.

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)
- A [Confluent Cloud](https://confluent.cloud/) account with an API key

### 1. Clone and build

```bash
git clone https://github.com/confluentinc/claude-code-confluent-plugin.git
cd claude-code-confluent-plugin
npm install
npm run build
```

### 2. Set environment variables

```bash
export CONFLUENT_CLOUD_API_KEY=your-api-key
export CONFLUENT_CLOUD_API_SECRET=your-api-secret
```

Generate API keys at [Confluent Cloud Settings > API Keys](https://confluent.cloud/settings/api-keys). Use a Cloud resource management API key (not a cluster-scoped key).

### 3. Open Claude Code

```bash
claude
```

Claude Code will automatically detect the `.mcp.json` configuration and start the MCP server.

### 4. Use the slash commands

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

The `.mcp.json` file configures the MCP server:

```json
{
  "mcpServers": {
    "confluent-infra": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "CONFLUENT_CLOUD_API_KEY": "${CONFLUENT_CLOUD_API_KEY}",
        "CONFLUENT_CLOUD_API_SECRET": "${CONFLUENT_CLOUD_API_SECRET}"
      }
    }
  }
}
```

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

Apache-2.0
