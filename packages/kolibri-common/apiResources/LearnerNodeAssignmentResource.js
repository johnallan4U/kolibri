import { Resource } from 'kolibri/apiResource';

export default new Resource({
  name: 'learnernodeassignment',
  namespace: 'core',
  assign({ contentnode_id, learner }) {
    return this.postListEndpoint('list', { contentnode_id, learner });
  },
  unassign({ contentnode_id, learner }) {
    return this.accessListEndpoint('delete', 'unassign', { contentnode_id, learner });
  },
  /**
   * @param {Object} options
   * @param {string} options.learner - the learner id to fetch completion for
   * @param {string[]} options.node_ids - ContentNode ids to fetch, one call
   * per tree level being browsed, not one call per node.
   * @return {Promise<Object>} { [node_id]: { assigned, completed_count, total_count } }
   */
  fetchCompletion({ learner, node_ids }) {
    return this.getListEndpoint('completion', { learner, node_ids: node_ids.join(',') }).then(
      response => response.data,
    );
  },
});
