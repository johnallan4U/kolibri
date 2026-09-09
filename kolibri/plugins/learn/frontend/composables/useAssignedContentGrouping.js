import sortBy from 'lodash/sortBy';

// A node is done once every one of its descendant resources (or, for a leaf
// resource, itself) has been completed - matches the completion shape
// returned by node_assignments' completion endpoint (totalCount is 0 only
// for the rare edge case of an empty/unavailable topic, which we don't
// consider "done").
export function isComplete(node) {
  return node.totalCount > 0 && node.completedCount >= node.totalCount;
}

/**
 * Groups still-incomplete assigned nodes by their channel - the closest
 * thing to a "subject" this content library has - so a learner isn't
 * scanning one flat list of unrelated topics to find their reading vs.
 * math. Completed nodes are left out entirely (they belong in a separate
 * "completed" list - see isComplete above).
 *
 * @param {Object[]} contentNodes - decorated ContentNode objects (each with
 *   channel_id, completedCount, totalCount - see useAssignedContent)
 * @param {(channelId: string) => string} getChannelTitle
 * @return {{channelId: string, title: string, nodes: Object[]}[]} groups,
 *   sorted alphabetically by title
 */
export function groupIncompleteBySubject(contentNodes, getChannelTitle) {
  const groups = {};
  for (const node of contentNodes) {
    if (isComplete(node)) {
      continue;
    }
    if (!groups[node.channel_id]) {
      groups[node.channel_id] = {
        channelId: node.channel_id,
        title: getChannelTitle(node.channel_id) || node.channel_id,
        nodes: [],
      };
    }
    groups[node.channel_id].nodes.push(node);
  }
  return sortBy(Object.values(groups), 'title');
}
