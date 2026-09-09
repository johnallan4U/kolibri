from le_utils.constants import content_kinds

from .models import LearnerNodeAssignment
from kolibri.core.content.models import ContentNode
from kolibri.core.logger.models import ContentSummaryLog

# Conservative upper bound for SQL IN-clause list lengths, matching
# kolibri.plugins.coach.unit_report_api's own chunking (SQLite's default
# SQLITE_MAX_VARIABLE_NUMBER is 999; staying under 900 leaves headroom for
# other bind parameters in the same query).
_IN_CHUNK_SIZE = 900


def _chunked(lst, size):
    """Yield successive sublists of at most *size* items."""
    for i in range(0, len(lst), size):
        yield lst[i : i + size]


def _completed_count(content_ids, learner_id):
    content_ids = list(content_ids)
    completed = 0
    for chunk in _chunked(content_ids, _IN_CHUNK_SIZE):
        completed += ContentSummaryLog.objects.filter(
            user_id=learner_id, content_id__in=chunk, progress=1
        ).count()
    return completed


def get_completion_for_nodes(node_ids, learner_id):
    """
    For each of node_ids (a topic or a leaf resource), return whether it's
    directly assigned to learner_id and how much of it that learner has
    completed. For a topic, "how much" is a leaf-descendant count/total -
    this is the only place that leaf-descendant enumeration ever happens;
    assigning/unassigning (see viewsets.py) is always a single-row write
    regardless of subtree size.

    :param node_ids: iterable of ContentNode ids (hex strings)
    :param learner_id: a FacilityUser id
    :return: {node_id: {"assigned": bool, "completed_count": int, "total_count": int}}
    """
    node_ids = list(node_ids)
    nodes = ContentNode.objects.filter(id__in=node_ids)

    assigned_ids = set(
        LearnerNodeAssignment.objects.filter(
            learner_id=learner_id, contentnode_id__in=node_ids
        ).values_list("contentnode_id", flat=True)
    )

    result = {}
    for node in nodes:
        if node.kind == content_kinds.TOPIC:
            leaf_content_ids = list(node.get_descendant_content_ids())
            total = len(leaf_content_ids)
            completed = _completed_count(leaf_content_ids, learner_id) if total else 0
        else:
            total = 1
            completed = _completed_count([node.content_id], learner_id)
        result[str(node.id)] = {
            "assigned": node.id in assigned_ids,
            "completed_count": completed,
            "total_count": total,
        }
    return result
