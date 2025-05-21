import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class HttpHeaderAuthApi implements ICredentialType {
	name = 'httpHeaderAuthApi';
	displayName = 'HTTP Header Auth';
	documentationUrl = 'https://developers.explorium.ai/';

	properties: INodeProperties[] = [
		{
			displayName: 'Authentication Header Name',
			name: 'name',
			type: 'string',
			default: 'Authorization',
			description: 'Name of the header to use for authentication',
		},
		{
			displayName: 'Authentication Header Value',
			name: 'value',
			type: 'string',
			default: '',
			description: 'Value of the header to use for authentication',
		},
	];
}
