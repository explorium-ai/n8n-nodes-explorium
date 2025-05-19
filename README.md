# n8n-nodes-explorium-mcp

This is an n8n community node that lets you interact with Explorium's Model Context Protocol (MCP) server at `https://explorium-mcp-sse.explorium.ninja/sse`.

MCP is a protocol that enables AI models to interact with external tools and data sources in a standardized way. This node is specifically configured to connect to Explorium's MCP server, allowing you to access its resources, execute tools, and use prompts.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)
[Credentials](#credentials)
[Environment Variables](#environment-variables)
[Operations](#operations)
[Using as a Tool](#using-as-a-tool)
[Compatibility](#compatibility)
[Resources](#resources)

## Getting Started

Official Quickstart Video:

[![MCP Client Node Quickstart](/assets/mcp-n8n.png)](https://youtu.be/1t8DQL-jUJk)

### Community Videos

Shoutout to all the creators of the following n8n community videos that are great resources for learning how to use this node:

- [Is MCP the Future of N8N AI Agents? (Fully Tested!)](https://youtu.be/sb5hCcFYPIE)
- [Connect N8N AI Agents to EVERYTHING using MCP?](https://youtu.be/tTDRgkD-120)
- [Build an AI Agent That Can Use Any Tool (MCP in n8n Tutorial)](https://www.youtube.com/watch?v=SVZe2rdhYmA)
- [The NEW N8N MCP is an Absolute Game-Changer (Brave Search MCP)](https://youtu.be/RxXS_FpJyGM)
- [MCP & n8n Automation: The Ultimate Guide for MCP AI Agents (2025)](https://www.youtube.com/watch?v=mbQsnrxHPwE)
- [REVOLUÇÃO na criação de AGENTES no N8N com o MCP Server!!!](https://www.youtube.com/watch?v=zgH85dJcs5c) (Portuguese)

If you have a great video that you'd like to share, please let me know and I'll add it to the list!

#### Interested a deeper dive into MCP?

Check out my YouTube Series [MCP Explained](https://www.youtube.com/playlist?list=PLjOCx_PNfJ4S_oOSqrMi6t9_x1GllvQZO) for more information about the Model Context Protocol.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

Also pay attention to Environment Variables for [using tools in AI Agents](#using-as-a-tool). It's mandatory to set the `N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE` environment variable to `true` if you want to use the Explorium MCP node as a tool in AI Agents.

## Credentials

The Explorium MCP node requires credentials to connect to the Explorium MCP server:

![Explorium MCP Credentials](./assets/sse-credentials.png)

- **SSE Connection Timeout**: Timeout for the connection in milliseconds (default: 60000)
- **Additional Headers**: Optional headers to send with requests (format: NAME=VALUE, separated by commas)

## Environment Variables

The MCP Client node supports passing environment variables to MCP servers using the command-line based transport in two ways:

### 1. Using the Credentials UI

You can add environment variables directly in the credentials configuration:

![Environment Variables in Credentials](./assets/credentials-envs.png)

This method is useful for individual setups and testing. The values are stored securely as credentials in n8n.

### 2. Using Docker Environment Variables

For Docker deployments, you can pass environment variables directly to your MCP servers by prefixing them with `MCP_`:

```yaml
version: '3'

services:
  n8n:
    image: n8nio/n8n
    environment:
      - MCP_BRAVE_API_KEY=your-api-key-here
      - MCP_OPENAI_API_KEY=your-openai-key-here
      - MCP_CUSTOM_SETTING=some-value
    # other configuration...
```

These environment variables will be automatically passed to your MCP servers when they are executed.

### Example: Using Brave Search MCP Server

This example shows how to set up and use the Brave Search MCP server:

1. Install the Brave Search MCP server:
   ```bash
   npm install -g @modelcontextprotocol/server-brave-search
   ```

2. Configure MCP Client credentials:
   - **Command**: `npx`
   - **Arguments**: `-y @modelcontextprotocol/server-brave-search`
   - **Environment Variables**: `BRAVE_API_KEY=your-api-key` Add a variables (space comma or newline separated)

3. Create a workflow that uses the MCP Client node:
   - Add an MCP Client node
   - Select the "List Tools" operation to see available search tools
   - Add another MCP Client node
   - Select the "Execute Tool" operation
   - Choose the "brave_search" tool
   - Set Parameters to: `{"query": "latest AI news"}`

![Brave Search Example](./assets/brave-search-example.png)

The node will execute the search and return the results in the output.

### Example: Multi-Server Setup with AI Agent

This example demonstrates how to set up multiple MCP servers in a production environment and use them with an AI agent:

1. Configure your docker-compose.yml file:

```yaml
version: '3'

services:
  n8n:
    image: n8nio/n8n
    environment:
      # MCP server environment variables
      - MCP_BRAVE_API_KEY=your-brave-api-key
      - MCP_OPENAI_API_KEY=your-openai-key
      - MCP_SERPER_API_KEY=your-serper-key
      - MCP_WEATHER_API_KEY=your-weather-api-key

      # Enable community nodes as tools
      - N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true
    ports:
      - "5678:5678"
    volumes:
      - ~/.n8n:/home/node/.n8n
```

2. Create multiple MCP Client credentials in n8n:

   **Brave Search Credentials**:
   - Command: `npx`
   - Arguments: `-y @modelcontextprotocol/server-brave-search`

   **OpenAI Tools Credentials**:
   - Command: `npx`
   - Arguments: `-y @modelcontextprotocol/server-openai`

   **Web Search Credentials**:
   - Command: `npx`
   - Arguments: `-y @modelcontextprotocol/server-serper`

   **Weather API Credentials**:
   - Command: `npx`
   - Arguments: `-y @modelcontextprotocol/server-weather`

3. Create an AI Agent workflow:
   - Add an AI Agent node
   - Enable MCP Client as a tool
   - Configure different MCP Client nodes with different credentials
   - Create a prompt that uses multiple data sources

![Multi-Server Setup](./assets/multi-server-example.png)

Example AI Agent prompt:
```
I need you to help me plan a trip. First, search for popular destinations in {destination_country}.
Then, check the current weather in the top 3 cities.
Finally, find some recent news about travel restrictions for these places.
```

With this setup, the AI agent can use multiple MCP tools across different servers, all using environment variables configured in your Docker deployment.

### Example: Using a Local MCP Server with SSE

This example shows how to connect to a locally running MCP server using Server-Sent Events (SSE):

1. Start a local MCP server that supports SSE:
   ```bash
   npx @modelcontextprotocol/server-example-sse
   ```

   Or run your own custom MCP server with SSE support on port 3001.

2. Configure MCP Client credentials:
   - In the node settings, select **Connection Type**: `Server-Sent Events (SSE)`
   - Create new credentials of type **MCP Client (SSE) API**
   - Set **SSE URL**: `http://localhost:3001/sse`
   - Add any required headers if your server needs authentication

3. Create a workflow that uses the MCP Client node:
   - Add an MCP Client node
   - Set the Connection Type to `Server-Sent Events (SSE)`
   - Select your SSE credentials
   - Select the "List Tools" operation to see available tools
   - Execute the workflow to see the results

![SSE Example](./assets/sse-example.png)

This method is particularly useful when:
- Your MCP server is running as a standalone service
- You're connecting to a remote MCP server
- Your server requires special authentication headers
- You need to separate the transport channel from the message channel

## Operations

The Explorium MCP node supports the following operations:

- **List Tools**: Get a list of available tools from the Explorium MCP server
- **Execute Tool**: Execute a specific tool by name with parameters
- **List Prompts**: Get a list of available prompt templates
- **Get Prompt**: Get details of a specific prompt template
- **List Resources**: Get a list of available resources
- **List Resource Templates**: Get a list of available resource templates
- **Read Resource**: Read a specific resource by URI

## Using as a Tool

The Explorium MCP node can be used as a tool in AI Agents. To enable this functionality, you need to set the following environment variable:

```
N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true
```

This allows the AI Agent to use the Explorium MCP node as a tool in your workflows.

### Example: Using the Explorium MCP with AI Agent

1. Create an AI Agent workflow:
   - Add an AI Agent node
   - Enable Explorium MCP as a tool
   - Configure your credentials for the Explorium MCP node
   - Create a prompt that uses Explorium's tools

Example AI Agent prompt:
```
I need you to help me analyze some data. Use the Explorium MCP tools to process the following data: {data}.
```

## Compatibility

This node has been tested with n8n version 1.0.0 and later.

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
* [Model Context Protocol Documentation](https://modelcontextprotocol.io/docs/)
* [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
* [MCP Transports Overview](https://modelcontextprotocol.io/docs/concepts/transports)
* [Using SSE in MCP](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/src/client/sse.ts)


