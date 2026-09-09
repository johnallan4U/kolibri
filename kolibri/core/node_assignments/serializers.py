from collections import OrderedDict

from rest_framework.serializers import ModelSerializer
from rest_framework.serializers import PrimaryKeyRelatedField

from .models import LearnerNodeAssignment
from kolibri.core.api import HexUUIDField
from kolibri.core.auth.models import FacilityUser
from kolibri.core.content.models import ContentNode


class LearnerNodeAssignmentSerializer(ModelSerializer):
    contentnode_id = HexUUIDField()
    learner = PrimaryKeyRelatedField(
        read_only=False, queryset=FacilityUser.objects.all()
    )
    assigned_by = PrimaryKeyRelatedField(
        read_only=False, queryset=FacilityUser.objects.all()
    )

    class Meta:
        model = LearnerNodeAssignment
        fields = ("id", "contentnode_id", "title", "learner", "assigned_by")
        # Disable DRF's auto-generated UniqueTogetherValidator (from the
        # model's unique_together) so re-assigning an already-assigned node
        # reaches create()'s get_or_create() as a no-op, rather than
        # failing validation with a 400 before create() ever runs.
        validators = []

    def to_internal_value(self, data):
        """
        POST a new assignment with the following payload:
        {
            "contentnode_id": "df6308209356328f726a09aa9bd323b7",
            "learner": "df6308209356328f726a09aa9bd323b8",
        }
        `title` and `assigned_by` are never trusted from the client - both
        are set here (rather than in create()) so they're already present
        in validated_data by the time KolibriAuthPermissions.can_create
        does its dry-run model validation ahead of the permission check.
        """
        data = OrderedDict(data)
        data["assigned_by"] = self.context["request"].user.id
        node = ContentNode.objects.get(id=data["contentnode_id"])
        data["title"] = node.title
        return super().to_internal_value(data)

    def create(self, validated_data):
        # Idempotent: checking an already-assigned node again is a no-op,
        # not an error, since unique_together would otherwise raise on a
        # second plain create().
        assignment, _ = LearnerNodeAssignment.objects.get_or_create(
            contentnode_id=validated_data["contentnode_id"],
            learner=validated_data["learner"],
            defaults={
                "title": validated_data["title"],
                "assigned_by": validated_data["assigned_by"],
            },
        )
        return assignment
