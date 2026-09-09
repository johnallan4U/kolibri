from rest_framework.decorators import action
from rest_framework.response import Response

from .models import LearnerNodeAssignment
from .serializers import LearnerNodeAssignmentSerializer
from kolibri.core.api import ValuesViewset
from kolibri.core.auth.api import KolibriAuthPermissions
from kolibri.core.auth.api import KolibriAuthPermissionsFilter


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
