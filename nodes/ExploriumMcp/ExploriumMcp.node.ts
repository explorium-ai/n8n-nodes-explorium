import {
	NodeConnectionType,
	NodeOperationError,
	type INodeType,
	type INodeTypeDescription,
	type ISupplyDataFunctions,
	type SupplyData,
} from 'n8n-workflow';
import { connectMcpClient, createCallTool, getAllTools, mcpToolToDynamicTool } from './utils';

// Constant SSE Endpoint
const SSE_ENDPOINT = 'https://mcp-auth.explorium.ai/sse';

export class ExploriumMcp implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Explorium MCP Client',
		name: 'exploriumMcp',
		icon: 'file:mcpClient.svg',
		group: ['output'],
		version: 1,
		description: 'Connect to Explorium Agent Source',
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
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [{ type: NodeConnectionType.AiTool, displayName: 'Tools' }],
		credentials: [
			{
				name: 'httpHeaderAuthApi',
				required: true,
				displayOptions: {
					show: {
						authentication: ['headerAuth'],
					},
				},
			},
		],
		properties: [
			{
				displayName: 'Authentication',
				name: 'authentication',
				type: 'options',
				options: [
					{
						name: 'Header Auth',
						value: 'headerAuth',
					},
					{
						name: 'None',
						value: 'none',
					},
				],
				default: 'none',
				description: 'The way to authenticate with your SSE endpoint',
			},
			{
				displayName: 'Credentials',
				name: 'credentials',
				type: 'credentials',
				default: '',
				displayOptions: {
					show: {
						authentication: ['headerAuth'],
					},
				},
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('httpHeaderAuthApi');
		const headers = {
			api_key: String(credentials.value),
			// Authorization: `Bearer ${credentials.value}`,
		};
		const node = this.getNode();

		const setError = (message: string, description?: string): SupplyData => {
			const error = new NodeOperationError(node, message, { itemIndex, description });
			this.addOutputData(NodeConnectionType.AiTool, itemIndex, error);
			throw error;
		};

		if (!headers) {
			return setError(
				'HTTP Header Authentication is required',
				'Please configure the HTTP Header Authentication credentials properly.',
			);
		}

		console.log(headers, headers);
		const client = await connectMcpClient({
			sseEndpoint: SSE_ENDPOINT,
			headers,
			name: node.type,
			version: node.typeVersion,
		});

		if (!client.ok) {
			this.logger.error('ExploriumMcp: Failed to connect to MCP Server', {
				error: client.error,
			});

			return setError('Could not connect to Explorium MCP server.');
		}

		this.logger.debug('ExploriumMcp: Successfully connected to MCP Server');

		const allTools = await getAllTools(client.result);

		if (!allTools.length) {
			return setError(
				'Explorium MCP Server returned no tools',
				'Connected successfully to the MCP server but it returned an empty list of tools.',
			);
		}

		const tools = allTools.map(
			(tool) =>
				mcpToolToDynamicTool(
					tool,
					createCallTool(tool.name, client.result, (error) => {
						this.logger.error(`ExploriumMcp: Tool "${tool.name}" failed to execute`, { error });
						throw new NodeOperationError(node, `Failed to execute tool "${tool.name}"`, {
							description: error,
						});
					}),
				),
			this,
		);

		return { response: tools, closeFunction: async () => await client.result.close() };
	}
}
