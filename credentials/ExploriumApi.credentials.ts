import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class ExploriumApi implements ICredentialType {
	name = 'exploriumApi';
	displayName = 'Explorium API';
	documentationUrl = 'https://explorium.ai';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
		},
	];
}
