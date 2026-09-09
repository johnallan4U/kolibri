from rest_framework.decorators import action
from rest_framework.response import Response

from .completion import get_completion_for_nodes
from .models import LearnerNodeAssignment
from .serializers import LearnerNodeAssignmentSerializer
from kolibri.core.api import ValuesViewset
from kolibri.core.auth.api import KolibriAuthPermissions
from kolibri.core.auth.api import KolibriAuthPermissionsFilter
from kolibri.core.auth.models import FacilityUser


class LearnerNodeAssignmentViewset(ValuesViewset):
    serializer_class = LearnerNodeAssignmentSerializer
    filter_backends = (KolibriAuthPermissionsFilter,)
    permission_classes = (KolibriAuthPermissions,)
    queryset = LearnerNodeAssignment.objects.all()

    values = (
        "id",
        "contentnode_id",
        "title",
        "learner",
        "assigned_by",
        "date_assigned",
    )

    @action(detail=False, methods=["delete"])
    def unassign(self, request):
        """
        Unassign a node from a learner. A no-op (not an error) if the node
        wasn't assigned to that learner in the first place, matching the
        idempotent semantics of a checkbox the coach can toggle freely.
        """
        # DELETE requests send their body as `request.data`, not query
        # params (matching how the frontend Resource's accessListEndpoint
        # sends args for any non-GET method).
        contentnode_id = request.data.get("contentnode_id")
        learner_id = request.data.get("learner")
        # KolibriAuthPermissionsFilter only scopes GET requests (it assumes
        # non-GET requests get checked object-by-object via
        # has_object_permission, which never runs for a detail=False
        # action) - so scope this delete manually via filter_readable,
        # which shares can_be_deleted_by's exact role/collection scoping
        # for this model. filter_readable applies .distinct(), which
        # Django refuses to combine with .delete(), so resolve matching
        # ids first and delete those from a fresh, undecorated queryset.
        readable_ids = request.user.filter_readable(
            self.get_queryset().filter(
                contentnode_id=contentnode_id, learner_id=learner_id
            )
        ).values_list("id", flat=True)
        LearnerNodeAssignment.objects.filter(id__in=list(readable_ids)).delete()
        return Response(status=204)

    @action(detail=False, methods=["get"])
    def completion(self, request):
        """
        Batch completion/assignment status for a set of nodes, for one
        learner - one call per tree level the coach is browsing, not one
        call per node. GET requests are the one place a plain queryset
        `.filter()` here would be unscoped (this action never touches
        self.get_queryset()), so the learner is explicitly permission-
        checked before any data is computed.
        """
        learner_id = request.query_params.get("learner")
        node_ids = [n for n in request.query_params.get("node_ids", "").split(",") if n]
        if not learner_id or not node_ids:
            return Response({})
        if not request.user.filter_readable(
            FacilityUser.objects.filter(id=learner_id)
        ).exists():
            return Response(status=403)
        return Response(get_completion_for_nodes(node_ids, learner_id))
