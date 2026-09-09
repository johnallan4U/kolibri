import uuid

from django.db.utils import IntegrityError
from django.test import TestCase

from kolibri.core.auth.models import Facility
from kolibri.core.auth.models import FacilityUser
from kolibri.core.auth.test.helpers import provision_device
from kolibri.core.node_assignments.models import LearnerNodeAssignment

DUMMY_PASSWORD = "password"


class LearnerNodeAssignmentModelTestCase(TestCase):
    databases = "__all__"

    @classmethod
    def setUpTestData(cls):
        provision_device()
        cls.facility = Facility.objects.create(name="TestFacility")
        cls.coach = FacilityUser.objects.create(username="coach", facility=cls.facility)
        cls.learner = FacilityUser.objects.create(
            username="learner", facility=cls.facility
        )
        cls.contentnode_id = uuid.uuid4().hex

    def test_infers_dataset_from_learner(self):
        assignment = LearnerNodeAssignment.objects.create(
            contentnode_id=self.contentnode_id,
            title="Some Topic",
            learner=self.learner,
            assigned_by=self.coach,
        )
        self.assertEqual(assignment.dataset_id, self.learner.dataset_id)

    def test_partition_is_learner_scoped(self):
        assignment = LearnerNodeAssignment.objects.create(
            contentnode_id=self.contentnode_id,
            title="Some Topic",
            learner=self.learner,
            assigned_by=self.coach,
        )
        self.assertEqual(
            assignment._morango_partition,
            "{dataset_id}:user-rw:{user_id}".format(
                dataset_id=assignment.dataset_id, user_id=self.learner.id
            ),
        )

    def test_same_node_cannot_be_assigned_twice_to_same_learner(self):
        LearnerNodeAssignment.objects.create(
            contentnode_id=self.contentnode_id,
            title="Some Topic",
            learner=self.learner,
            assigned_by=self.coach,
        )
        with self.assertRaises(IntegrityError):
            LearnerNodeAssignment.objects.create(
                contentnode_id=self.contentnode_id,
                title="Some Topic",
                learner=self.learner,
                assigned_by=self.coach,
            )

    def test_same_node_can_be_assigned_to_different_learners(self):
        other_learner = FacilityUser.objects.create(
            username="other_learner", facility=self.facility
        )
        LearnerNodeAssignment.objects.create(
            contentnode_id=self.contentnode_id,
            title="Some Topic",
            learner=self.learner,
            assigned_by=self.coach,
        )
        # Should not raise.
        LearnerNodeAssignment.objects.create(
            contentnode_id=self.contentnode_id,
            title="Some Topic",
            learner=other_learner,
            assigned_by=self.coach,
        )
