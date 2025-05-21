// This file ensures n8n can find and load your nodes and credentials
const { ExploriumMcp } = require('./dist/nodes/ExploriumMcp/ExploriumMcp.node.js');
const { HttpHeaderAuthApi } = require('./dist/credentials/HttpHeaderAuthApi.credentials.js');

module.exports = {
	nodeTypes: { exploriumMcp: ExploriumMcp },
	credentialTypes: { httpHeaderAuthApi: HttpHeaderAuthApi },
};
