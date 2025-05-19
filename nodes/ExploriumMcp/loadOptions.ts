import {
	type ILoadOptionsFunctions,
	type INodePropertyOptions,
	NodeOperationError,
} from 'n8n-workflow';

import { connectMcpClient, getAllTools, getAuthHeaders } from './utils';
import type { McpTool } from './types';

// Use the same constant as in ExploriumMcp.node.ts
const SSE_ENDPOINT = 'https://explorium-mcp-sse.explorium.ninja/sse';

export async function getTools(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const node = this.getNode();
	
	// Use the simplified getAuthHeaders
	const { headers } = await getAuthHeaders(this);
	
	if (!headers) {
		throw new NodeOperationError(this.getNode(), 'HTTP Header Authentication is required');
	}
	
	const client = await connectMcpClient({
		sseEndpoint: SSE_ENDPOINT,
		headers,
		name: node.type,
		version: node.typeVersion,
	});

	if (!client.ok) {
		throw new NodeOperationError(this.getNode(), 'Could not connect to your MCP server');
	}

	const tools = await getAllTools(client.result);
	return tools.map((tool: McpTool) => ({
		name: tool.name,
		value: tool.name,
		description: tool.description,
		inputSchema: tool.inputSchema,
	}));
}