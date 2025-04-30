// This file ensures n8n can find and load your nodes and credentials
const ExploriumMcpNode = require('./dist/nodes/ExploriumMcp/ExploriumMcp.node.js');

module.exports = {
	nodeTypes: {
		ExploriumMcp: ExploriumMcpNode.ExploriumMcp,
	},
};
