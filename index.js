// This file ensures n8n can find and load your nodes and credentials
const { ExploriumMcp, ExploriumApi } = require('./dist/nodes/ExploriumMcp/ExploriumMcp.node.js');
const {
	HttpHeaderAuthApi,
	ExploriumApi: ExploriumApiCredentials,
} = require('./dist/credentials/HttpHeaderAuthApi.credentials.js');

module.exports = {
	nodeTypes: { exploriumMcp: ExploriumMcp, exploriumApi: ExploriumApi },
	credentialTypes: { httpHeaderAuthApi: HttpHeaderAuthApi, ExploriumApiCredentials },
};
