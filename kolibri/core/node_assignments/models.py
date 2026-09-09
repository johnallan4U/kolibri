from django.db import models
from morango.models import UUIDField

from kolibri.core.auth.constants import role_kinds
from kolibri.core.auth.models import AbstractFacilityDataModel
from kolibri.core.auth.models import FacilityUser
from kolibri.core.auth.permissions.base import RoleBasedPermissions
from kolibri.core.fields import DateTimeTzField
from kolibri.utils.time_utils import local_now


class LearnerNodeAssignment(AbstractFacilityDataModel):
    """
    Records that a single ContentNode (a topic or an individual resource -
    not necessarily authored as a Course) has been directly assigned to one
    learner, via the simplified per-student assignment tree. Unlike Lesson/
    Exam/CourseSession, there is no separate *Assignment linking table and
    no ad hoc group: this model is always exactly one node + one learner.
    """

    permissions = RoleBasedPermissions(
        target_field="learner",
        can_be_created_by=(role_kinds.ADMIN, role_kinds.COACH),
        can_be_read_by=(role_kinds.ADMIN, role_kinds.COACH),
        can_be_updated_by=(),
        can_be_deleted_by=(role_kinds.ADMIN, role_kinds.COACH),
        collection_field="learner__memberships__collection_id",
    )

    # Bare UUID reference to the ContentNode (topic or leaf resource) - not
    # an FK, mirroring CourseSession.course / UnitTestAssignment's
    # unit_contentnode_id (both "not FK due to sync constraints").
    contentnode_id = UUIDField()

    # Snapshot of the ContentNode's title at assignment time, for display
    # without depending on a lookup back into the content database.
    title = models.CharField(max_length=200)

    learner = models.ForeignKey(
        FacilityUser,
        related_name="node_assignments",
        blank=False,
        null=False,
        on_delete=models.CASCADE,
    )
    assigned_by = models.ForeignKey(
        FacilityUser,
        related_name="node_assignments_created",
        blank=False,
        null=True,
        on_delete=models.CASCADE,
    )
    date_assigned = DateTimeTzField(default=local_now, editable=False)

    morango_model_name = "learnernodeassignment"

    class Meta:
        unique_together = ("contentnode_id", "learner")

    def __str__(self):
        return "LearnerNodeAssignment {} for {}".format(self.title, self.learner)

    def infer_dataset(self, *args, **kwargs):
        return self.cached_related_dataset_lookup("learner")

    def calculate_partition(self):
        return "{dataset_id}:user-rw:{user_id}".format(
            dataset_id=self.dataset_id, user_id=self.learner_id
        )
