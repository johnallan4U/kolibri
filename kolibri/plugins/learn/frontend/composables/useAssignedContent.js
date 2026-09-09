import { ref } from 'vue';
import { set } from '@vueuse/core';
import ContentNodeResource from 'kolibri-common/apiResources/ContentNodeResource';
import LearnerNodeAssignmentResource from 'kolibri-common/apiResources/LearnerNodeAssignmentResource';

// Real ContentNode objects (title, is_leaf, thumbnail, etc.), each decorated
// with this learner's completedCount/totalCount for that node - module-level
// so HomePage and any other consumer share one fetch.
const assignedContentNodes = ref([]);

/**
 * Fetches the current learner's directly-assigned content (from the coach's
 * "Assign" tree - see kolibri.core.node_assignments), and decorates each
 * assigned ContentNode with this learner's completion for it.
 *
 * A stale contentnode_id (the content was removed/re-imported with a new id
 * since assignment) simply drops out here, since ContentNodeResource has no
 * matching row to return for it - matches this feature's existing decision
 * to not handle that case specially (see the Assign tree's own plan notes).
 */
export default function useAssignedContent() {
  function fetchAssignedContent(learnerId) {
    return LearnerNodeAssignmentResource.fetchCollection({
      getParams: { learner: learnerId },
    }).then(assignments => {
      if (!assignments.length) {
        set(assignedContentNodes, []);
        return [];
      }
      const nodeIds = assignments.map(assignment => assignment.contentnode_id);
      return Promise.all([
        ContentNodeResource.fetchCollection({ getParams: { ids: nodeIds.join(',') } }),
        LearnerNodeAssignmentResource.fetchCompletion({ learner: learnerId, node_ids: nodeIds }),
      ]).then(([nodes, completion]) => {
        const decorated = nodes.map(node => {
          const nodeCompletion = completion[node.id] || {};
          return {
            ...node,
            completedCount: nodeCompletion.completed_count || 0,
            totalCount: nodeCompletion.total_count || 0,
          };
        });
        set(assignedContentNodes, decorated);
        return decorated;
      });
    });
  }

  return {
    assignedContentNodes,
    fetchAssignedContent,
  };
}
