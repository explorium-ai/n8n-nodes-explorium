// This file ensures n8n can find and load your nodes and credentials
const { ExploriumMcp } = require('./dist/nodes/ExploriumMcp/ExploriumMcp.node.js');
const { HttpHeaderAuth } = require('./dist/credentials/HttpHeaderAuth.credentials.js');

module.exports = {
	nodeTypes: { exploriumMcp: ExploriumMcp },
	credentialTypes: { httpHeaderAuth: HttpHeaderAuth },
};
