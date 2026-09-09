import { ref } from 'vue';
import ChannelResource from 'kolibri-common/apiResources/ChannelResource';
import ContentNodeResource from 'kolibri-common/apiResources/ContentNodeResource';
import LearnerNodeAssignmentResource from 'kolibri-common/apiResources/LearnerNodeAssignmentResource';
import useSnackbar from 'kolibri/composables/useSnackbar';
import { ContentNodeKinds } from 'kolibri/constants';

/**
 * Data-fetching and toggle logic for the per-student content assignment
 * tree. Reuses ContentNodeResource/ChannelResource for browsing (the same
 * primitives the Lesson/Quiz resource picker uses), but not
 * useResourceSelection's ephemeral selectedResources buffer - every node
 * here reflects live server state, and every checkbox toggle is an
 * immediate, independent write, not a batch save.
 *
 * @param {string} learnerId
 */
export default function useAssignContentTree(learnerId) {
  const { createSnackbar } = useSnackbar();

  const nodes = ref([]);
  const currentTopic = ref(null); // null while browsing the channel list
  const breadcrumbs = ref([]);
  const loading = ref(false);

  async function decorateWithAssignmentState(rawNodes) {
    if (!rawNodes.length) {
      return [];
    }
    const completion = await LearnerNodeAssignmentResource.fetchCompletion({
      learner: learnerId,
      node_ids: rawNodes.map(node => node.id),
    });
    return rawNodes.map(node => ({
      ...node,
      assigned: Boolean(completion[node.id]?.assigned),
      completedCount: completion[node.id]?.completed_count ?? 0,
      totalCount: completion[node.id]?.total_count ?? 0,
    }));
  }

  async function showChannels() {
    loading.value = true;
    currentTopic.value = null;
    breadcrumbs.value = [];
    try {
      const channels = await ChannelResource.fetchCollection({
        getParams: { available: true },
      });
      // Channels themselves aren't assignable/completable nodes - only
      // their content is - so they're rendered without checkboxes.
      nodes.value = channels.map(channel => ({
        id: channel.root,
        title: channel.name,
        kind: ContentNodeKinds.CHANNEL,
        isChannel: true,
      }));
    } finally {
      loading.value = false;
    }
  }

  /**
   * @param {string} topicId
   * @param {{title: string, assigned: boolean}|null} pushCrumb - append a
   * new breadcrumb entry for this topic (drilling in from a click); pass
   * null when returning to a topic already on the trail (breadcrumb click).
   */
  async function showTopic(topicId, pushCrumb) {
    loading.value = true;
    try {
      const topic = await ContentNodeResource.fetchTree({
        id: topicId,
        params: { include_coach_content: true },
      });
      if (pushCrumb) {
        breadcrumbs.value = [
          ...breadcrumbs.value,
          { id: topicId, title: pushCrumb.title, assigned: pushCrumb.assigned },
        ];
      }
      currentTopic.value = topic;
      nodes.value = await decorateWithAssignmentState(topic.children?.results || []);
    } finally {
      loading.value = false;
    }
  }

  function goToBreadcrumb(index) {
    if (index < 0) {
      return showChannels();
    }
    const crumb = breadcrumbs.value[index];
    // Keep the clicked crumb itself - only drop the ones after it.
    breadcrumbs.value = breadcrumbs.value.slice(0, index + 1);
    return showTopic(crumb.id, null);
  }

  async function toggleAssignment(node) {
    const wasAssigned = node.assigned;
    // Optimistic update - flip immediately, roll back on failure.
    node.assigned = !wasAssigned;
    try {
      if (wasAssigned) {
        await LearnerNodeAssignmentResource.unassign({
          contentnode_id: node.id,
          learner: learnerId,
        });
      } else {
        await LearnerNodeAssignmentResource.assign({
          contentnode_id: node.id,
          learner: learnerId,
        });
      }
    } catch (e) {
      node.assigned = wasAssigned;
      createSnackbar('There was a problem saving that change');
    }
  }

  return {
    nodes,
    currentTopic,
    breadcrumbs,
    loading,
    showChannels,
    showTopic,
    goToBreadcrumb,
    toggleAssignment,
  };
}
