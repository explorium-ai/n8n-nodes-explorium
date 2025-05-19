import {
	NodeConnectionType,
	NodeOperationError,
	type INodeType,
	type INodeTypeDescription,
	type ISupplyDataFunctions,
	type SupplyData,
} from 'n8n-workflow';

import {
	connectMcpClient,
	createCallTool,
	getAllTools,
	McpToolkit,
	mcpToolToDynamicTool,
	getAuthHeaders,
} from './utils';

// Constant SSE Endpoint
const SSE_ENDPOINT = 'https://explorium-mcp-sse.explorium.ninja/sse';

export class ExploriumMcp implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Explorium MCP Client',
		name: 'exploriumMcp',
		icon: 'file:mcpClient.svg',
		group: ['output'],
		version: 1,
		description: 'Connect to Explorium MCP Server',
		defaults: {
			name: 'Explorium MCP',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Model Context Protocol', 'Tools'],
			},
			alias: ['Model Context Protocol', 'MCP Client'],
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.toolmcp/',
					},
				],
			},
		},
		inputs: [],
		outputs: [{ type: NodeConnectionType.AiTool, displayName: 'Tools' }],
		credentials: [
			{
				name: 'httpHeaderAuth',
				required: true,
			},
		],
		properties: [],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {

		const node = this.getNode();
		
		const { headers } = await getAuthHeaders(this);
		
		if (!headers) {
			const error = new NodeOperationError(node, 'HTTP Header Authentication is required', { 
				itemIndex, 
				description: 'Please configure the HTTP Header Authentication credentials properly.' 
			});
			this.addOutputData(NodeConnectionType.AiTool, itemIndex, error);
			throw error;
		}

		const client = await connectMcpClient({
			sseEndpoint: SSE_ENDPOINT,
			headers,
			name: node.type,
			version: node.typeVersion,
		});

		const setError = (message: string, description?: string): SupplyData => {
			const error = new NodeOperationError(node, message, { itemIndex, description });
			this.addOutputData(NodeConnectionType.AiTool, itemIndex, error);
			throw error;
		};

		if (!client.ok) {
			this.logger.error('McpClientTool: Failed to connect to MCP Server', {
				error: client.error,
			});

			switch (client.error.type) {
				case 'invalid_url':
					return setError('Could not connect to Explorium MCP server. The server URL is invalid.');
				case 'connection':
				default:
					return setError('Could not connect to Explorium MCP server. Please check your credentials and try again.');
			}
		}

		this.logger.debug('McpClientTool: Successfully connected to MCP Server');

		const allTools = await getAllTools(client.result);

		if (!allTools.length) {
			return setError(
				'Explorium MCP Server returned no tools',
				'Connected successfully to the MCP server but it returned an empty list of tools.',
			);
		}

		const tools = allTools.map((tool) =>
			mcpToolToDynamicTool(
				tool,
				createCallTool(tool.name, client.result, (error) => {
					this.logger.error(`McpClientTool: Tool "${tool.name}" failed to execute`, { error });
					throw new NodeOperationError(node, `Failed to execute tool "${tool.name}"`, {
						description: error,
					});
				}),
			),
		);

		const toolkit = new McpToolkit(tools);

		return { response: toolkit, closeFunction: async () => await client.result.close() };
	}
}