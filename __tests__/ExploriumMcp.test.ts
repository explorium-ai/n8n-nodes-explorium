import { ExploriumMcp } from '../nodes/ExploriumMcp/ExploriumMcp.node';

describe('ExploriumMcp Node', () => {
	let mcpNode: ExploriumMcp;

	beforeEach(() => {
		mcpNode = new ExploriumMcp();
	});

	it('should have the correct node type', () => {
		expect(mcpNode.description.name).toBe('ExploriumMcp');
	});

	it('should have properties defined', () => {
		expect(mcpNode.description.properties).toBeDefined();
	});
});
