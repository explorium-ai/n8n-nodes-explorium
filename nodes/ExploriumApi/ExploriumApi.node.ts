import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';

import { OperationKey, operations } from './operations';

export class ExploriumApi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Explorium API',
		name: 'exploriumApi',
		icon: 'file:explorium.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Interact with Explorium API',
		defaults: {
			name: 'Explorium API',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'exploriumApi',
				required: true,
			},
		],
		hints: Object.entries(operations).map(([key, value]) => {
			return {
				type: 'info',
				message: `
					<a href="${value.docs}" target="_blank">
						View documentation for ${key}
					</a>
				`,
				// location?: 'outputPane' | 'inputPane' | 'ndv';
				displayCondition: `={{$parameter["operation"] === "${key}" }}`,
			};
		}),
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: Object.entries(operations).map(([key, value]) => ({
					name: key
						.split('-')
						.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
						.join(' '),
					value: key,
					description: value.description,
				})),
				default: '',
			},
			{
				displayName: 'Parameters',
				name: 'parameters',
				type: 'collection',
				placeholder: 'Add Parameter',
				default: {},
				options: Object.entries(operations).reduce((res, [key, value]) => {
					const current: INodeProperties[] = [];

					if (value.input.body) {
						// eslint-disable-next-line
						current.push({
							displayName: 'Body',
							typeOptions: { rows: 4 },
							name: 'body',
							type: 'json',
							default: value.input.body.example ?? '',
							description: 'The body of the request',
							displayOptions: { show: { '/operation': [key] } },
						});
					}

					if (value.input.search) {
						// eslint-disable-next-line n8n-nodes-base/node-param-default-missing
						current.push({
							displayName: 'Query parameters',
							typeOptions: { rows: 4 },
							name: 'search',
							type: 'json',
							default: value.input.search.example,
							description: 'The query parameters of the request',
							displayOptions: { show: { '/operation': [key] } },
						});
					}

					return [...res, ...current];
				}, [] as INodeProperties[]),
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as OperationKey;
		const parameters = this.getNodeParameter('parameters', 0) as {
			body?: string | Record<string, any>;
			search?: Record<string, any>;
		};

		for (let i = 0; i < items.length; i++) {
			try {
				const operationConfig = operations[operation];
				if (!operationConfig) {
					throw new NodeOperationError(this.getNode(), `Operation ${operation} not found`);
				}

				const credentials = await this.getCredentials('exploriumApi');

				let body: Record<string, any> | undefined;
				if (parameters.body) {
					if (typeof parameters.body === 'string') {
						body = JSON.parse(parameters.body);
					} else {
						body = parameters.body;
					}
				}

				// @ts-ignore
				console.log('METADATA', parameters.metadataUi);

				// Make API request
				const response = await this.helpers.httpRequest({
					method: operationConfig.method || 'POST',
					url: `https://api.explorium.ai${operationConfig.endpoint}`,
					body,
					qs: parameters.search,
					headers: {
						'content-type': 'application/json',
						api_key: credentials.apiKey,
					},
					json: true,
				});

				returnData.push({
					json: response,
				});
			} catch (_error) {
				let error;
				if (_error.response) {
					error = new Error(
						`Request failed with status: ${_error.response.status}.${
							_error.response.data ? `\ndata: ${JSON.stringify(_error.response.data, null, 2)}` : ''
						}`,
					);
				} else {
					error = _error;
				}
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
						},
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
