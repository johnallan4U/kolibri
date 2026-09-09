import ContentNodeResource from 'kolibri-common/apiResources/ContentNodeResource';
import LearnerNodeAssignmentResource from 'kolibri-common/apiResources/LearnerNodeAssignmentResource';
import useAssignedContent from '../useAssignedContent';

jest.mock('kolibri-common/apiResources/ContentNodeResource', () => ({
  __esModule: true,
  default: { fetchCollection: jest.fn() },
}));
jest.mock('kolibri-common/apiResources/LearnerNodeAssignmentResource', () => ({
  __esModule: true,
  default: { fetchCollection: jest.fn(), fetchCompletion: jest.fn() },
}));

describe('useAssignedContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches the assigned nodes and decorates them with this learner's completion", async () => {
    LearnerNodeAssignmentResource.fetchCollection.mockResolvedValue([
      { contentnode_id: 'node-1', learner: 'learner-1' },
      { contentnode_id: 'node-2', learner: 'learner-1' },
    ]);
    ContentNodeResource.fetchCollection.mockResolvedValue([
      { id: 'node-1', title: 'Node One', is_leaf: true },
      { id: 'node-2', title: 'Node Two', is_leaf: false },
    ]);
    LearnerNodeAssignmentResource.fetchCompletion.mockResolvedValue({
      'node-1': { assigned: true, completed_count: 1, total_count: 1 },
      'node-2': { assigned: true, completed_count: 3, total_count: 10 },
    });

    const { assignedContentNodes, fetchAssignedContent } = useAssignedContent();
    await fetchAssignedContent('learner-1');

    expect(LearnerNodeAssignmentResource.fetchCollection).toHaveBeenCalledWith({
      getParams: { learner: 'learner-1' },
    });
    expect(ContentNodeResource.fetchCollection).toHaveBeenCalledWith({
      getParams: { ids: 'node-1,node-2' },
    });
    expect(LearnerNodeAssignmentResource.fetchCompletion).toHaveBeenCalledWith({
      learner: 'learner-1',
      node_ids: ['node-1', 'node-2'],
    });
    expect(assignedContentNodes.value).toEqual([
      { id: 'node-1', title: 'Node One', is_leaf: true, completedCount: 1, totalCount: 1 },
      { id: 'node-2', title: 'Node Two', is_leaf: false, completedCount: 3, totalCount: 10 },
    ]);
  });

  it('resolves to an empty list without fetching content or completion when nothing is assigned', async () => {
    LearnerNodeAssignmentResource.fetchCollection.mockResolvedValue([]);

    const { assignedContentNodes, fetchAssignedContent } = useAssignedContent();
    await fetchAssignedContent('learner-1');

    expect(ContentNodeResource.fetchCollection).not.toHaveBeenCalled();
    expect(LearnerNodeAssignmentResource.fetchCompletion).not.toHaveBeenCalled();
    expect(assignedContentNodes.value).toEqual([]);
  });

  it('drops an assignment whose ContentNode no longer exists', async () => {
    LearnerNodeAssignmentResource.fetchCollection.mockResolvedValue([
      { contentnode_id: 'node-1', learner: 'learner-1' },
      { contentnode_id: 'stale-node', learner: 'learner-1' },
    ]);
    // The stale node's id has no matching ContentNode in the response - the
    // channel it belonged to was removed/re-imported since assignment.
    ContentNodeResource.fetchCollection.mockResolvedValue([
      { id: 'node-1', title: 'Node One', is_leaf: true },
    ]);
    LearnerNodeAssignmentResource.fetchCompletion.mockResolvedValue({
      'node-1': { assigned: true, completed_count: 0, total_count: 1 },
    });

    const { assignedContentNodes, fetchAssignedContent } = useAssignedContent();
    await fetchAssignedContent('learner-1');

    expect(assignedContentNodes.value).toHaveLength(1);
    expect(assignedContentNodes.value[0].id).toBe('node-1');
  });
});
