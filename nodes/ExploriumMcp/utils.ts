import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { CompatibilityCallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { jsonSchemaToZod } from '@n8n/json-schema-to-zod';
import type { JSONSchema7 } from 'json-schema';
import { DynamicStructuredTool, type DynamicStructuredToolInput } from 'langchain/tools';
import {
	createResultError,
	createResultOk,
	type IDataObject,
	type IExecuteFunctions,
	type Result,
} from 'n8n-workflow';
import { z } from 'zod';

type McpTool = { name: string; description?: string; inputSchema: JSONSchema7 };

export async function getAllTools(client: Client, cursor?: string): Promise<McpTool[]> {
	const { tools, nextCursor } = await client.listTools({ cursor });

	if (nextCursor) {
		return (tools as McpTool[]).concat(await getAllTools(client, nextCursor));
	}

	return tools as McpTool[];
}

interface ToolCallResult {
	content?: Array<{ type: 'text'; text: string }>;
	toolResult?: string;
	message?: string;
}

export const getErrorDescriptionFromToolCall = (result: unknown): string | undefined => {
	if (result && typeof result === 'object') {
		const typedResult = result as ToolCallResult;
		if ('content' in typedResult && Array.isArray(typedResult.content)) {
			const errorMessage = typedResult.content.find(
				(content) => content && typeof content === 'object' && typeof content.text === 'string',
			)?.text;
			return errorMessage;
		} else if ('toolResult' in typedResult && typeof typedResult.toolResult === 'string') {
			return typedResult.toolResult;
		}
		if ('message' in typedResult && typeof typedResult.message === 'string') {
			return typedResult.message;
		}
	}

	return undefined;
};

export const createCallTool =
	(name: string, client: Client, onError: (error: string | undefined) => void) =>
	async (args: IDataObject) => {
		try {
			const result = await client.callTool(
				{ name, arguments: args },
				CompatibilityCallToolResultSchema,
			);

			if (result.isError) {
				return onError(getErrorDescriptionFromToolCall(result));
			}

			if (result.toolResult !== undefined) {
				return result.toolResult;
			}

			if (result.content !== undefined) {
				return result.content;
			}

			return result;
		} catch (error) {
			return onError(getErrorDescriptionFromToolCall(error));
		}
	};

export function mcpToolToDynamicTool(
	tool: McpTool,
	onCallTool: DynamicStructuredToolInput['func'],
) {
	return new DynamicStructuredTool({
		name: tool.name,
		description: tool.description ?? '',
		schema: convertJsonSchemaToZod(tool.inputSchema),
		func: onCallTool,
		metadata: { isFromToolkit: true },
	});
}


type ConnectMcpClientError =
	| { type: 'invalid_url'; error: Error }
	| { type: 'connection'; error: Error };
export async function connectMcpClient({
	headers,
	sseEndpoint,
	name,
	version,
}: {
	sseEndpoint: string;
	headers?: Record<string, string>;
	name: string;
	version: number;
}): Promise<Result<Client, ConnectMcpClientError>> {
	try {
		const endpoint = new URL(sseEndpoint);

		const transport = new SSEClientTransport(endpoint, {
			eventSourceInit: {
				fetch: async (url, init) =>
					await fetch(url, {
						...init,
						headers: {
							...headers,
							Accept: 'text/event-stream',
						},
					}),
			},
			requestInit: { headers },
		});

		const client = new Client(
			{ name, version: version.toString() },
			{ capabilities: { tools: {} } },
		);

		await client.connect(transport);
		return createResultOk(client);
	} catch (error) {
		return createResultError({ type: 'connection', error });
	}
}

export async function getAuthHeaders(
	ctx: Pick<IExecuteFunctions, 'getCredentials'>,
): Promise<{ headers?: Record<string, string> }> {
	try {
		const header = await ctx.getCredentials<{ value: string }>('httpHeaderAuthApi');

		if (!header || !header.value) {
			return { headers: undefined };
		}

		return { headers: { Authorization: `Bearer ${header.value}` } };
	} catch (error) {
		// Credentials couldn't be retrieved
		return { headers: undefined };
	}
}

export function convertJsonSchemaToZod<T extends z.ZodTypeAny = z.ZodTypeAny>(schema: JSONSchema7) {
	return jsonSchemaToZod<T>(schema);
}
