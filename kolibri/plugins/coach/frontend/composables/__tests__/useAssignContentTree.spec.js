import ContentNodeResource from 'kolibri-common/apiResources/ContentNodeResource';
import LearnerNodeAssignmentResource from 'kolibri-common/apiResources/LearnerNodeAssignmentResource';
import useAssignContentTree from '../useAssignContentTree';

jest.mock('kolibri-common/apiResources/ChannelResource', () => ({
  __esModule: true,
  default: { fetchCollection: jest.fn() },
}));
jest.mock('kolibri-common/apiResources/ContentNodeResource', () => ({
  __esModule: true,
  default: { fetchTree: jest.fn() },
}));
jest.mock('kolibri-common/apiResources/LearnerNodeAssignmentResource', () => ({
  __esModule: true,
  default: { assign: jest.fn(), unassign: jest.fn(), fetchCompletion: jest.fn() },
}));
jest.mock('kolibri/composables/useSnackbar');

describe('useAssignContentTree', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('showTopic', () => {
    it('decorates each child node with its assignment/completion state', async () => {
      ContentNodeResource.fetchTree.mockResolvedValue({
        children: {
          results: [
            { id: 'node-1', title: 'Node One', kind: 'exercise' },
            { id: 'node-2', title: 'Node Two', kind: 'topic' },
          ],
        },
      });
      LearnerNodeAssignmentResource.fetchCompletion.mockResolvedValue({
        'node-1': { assigned: true, completed_count: 1, total_count: 1 },
        'node-2': { assigned: false, completed_count: 3, total_count: 10 },
      });

      const { nodes, showTopic } = useAssignContentTree('learner-1');
      await showTopic('topic-1', { title: 'Topic One', assigned: false });

      expect(nodes.value).toEqual([
        {
          id: 'node-1',
          title: 'Node One',
          kind: 'exercise',
          assigned: true,
          completedCount: 1,
          totalCount: 1,
        },
        {
          id: 'node-2',
          title: 'Node Two',
          kind: 'topic',
          assigned: false,
          completedCount: 3,
          totalCount: 10,
        },
      ]);
      expect(LearnerNodeAssignmentResource.fetchCompletion).toHaveBeenCalledWith({
        learner: 'learner-1',
        node_ids: ['node-1', 'node-2'],
      });
    });

    it('adds a breadcrumb entry carrying the assigned flag at click time', async () => {
      ContentNodeResource.fetchTree.mockResolvedValue({ children: { results: [] } });
      LearnerNodeAssignmentResource.fetchCompletion.mockResolvedValue({});

      const { breadcrumbs, showTopic } = useAssignContentTree('learner-1');
      await showTopic('topic-1', { title: 'Topic One', assigned: true });

      expect(breadcrumbs.value).toEqual([{ id: 'topic-1', title: 'Topic One', assigned: true }]);
    });
  });

  describe('toggleAssignment', () => {
    it('flips assigned optimistically and calls assign() when turning on', async () => {
      LearnerNodeAssignmentResource.assign.mockResolvedValue({});
      const { toggleAssignment } = useAssignContentTree('learner-1');
      const node = { id: 'node-1', assigned: false };

      const promise = toggleAssignment(node);
      expect(node.assigned).toBe(true); // optimistic, before the request resolves
      await promise;

      expect(LearnerNodeAssignmentResource.assign).toHaveBeenCalledWith({
        contentnode_id: 'node-1',
        learner: 'learner-1',
      });
      expect(node.assigned).toBe(true);
    });

    it('calls unassign() when turning off', async () => {
      LearnerNodeAssignmentResource.unassign.mockResolvedValue({});
      const { toggleAssignment } = useAssignContentTree('learner-1');
      const node = { id: 'node-1', assigned: true };

      await toggleAssignment(node);

      expect(LearnerNodeAssignmentResource.unassign).toHaveBeenCalledWith({
        contentnode_id: 'node-1',
        learner: 'learner-1',
      });
      expect(node.assigned).toBe(false);
    });

    it('rolls back the optimistic update if the request fails', async () => {
      LearnerNodeAssignmentResource.assign.mockRejectedValue(new Error('network error'));
      const { toggleAssignment } = useAssignContentTree('learner-1');
      const node = { id: 'node-1', assigned: false };

      await toggleAssignment(node);

      expect(node.assigned).toBe(false);
    });
  });
});
