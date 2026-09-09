import uuid

from django.urls import reverse
from rest_framework import status

from kolibri.core.auth.models import Classroom
from kolibri.core.auth.models import Facility
from kolibri.core.auth.models import FacilityUser
from kolibri.core.auth.test.helpers import KolibriAPITestCase as APITestCase
from kolibri.core.auth.test.helpers import provision_device
from kolibri.core.content.models import ContentNode
from kolibri.core.node_assignments.models import LearnerNodeAssignment

DUMMY_PASSWORD = "password"


class LearnerNodeAssignmentAPITestCase(APITestCase):
    databases = "__all__"

    @classmethod
    def setUpTestData(cls):
        provision_device()
        cls.facility = Facility.objects.create(name="MyFac")
        cls.classroom = Classroom.objects.create(name="Classroom", parent=cls.facility)

        cls.coach = FacilityUser.objects.create(username="coach", facility=cls.facility)
        cls.coach.set_password(DUMMY_PASSWORD)
        cls.coach.save()
        cls.classroom.add_coach(cls.coach)

        cls.learner = FacilityUser.objects.create(
            username="learner", facility=cls.facility
        )
        cls.learner.set_password(DUMMY_PASSWORD)
        cls.learner.save()
        cls.classroom.add_member(cls.learner)

        # An unrelated coach/classroom, for permission-denial tests.
        cls.other_facility = Facility.objects.create(name="OtherFac")
        cls.other_classroom = Classroom.objects.create(
            name="OtherClassroom", parent=cls.other_facility
        )
        cls.other_coach = FacilityUser.objects.create(
            username="other_coach", facility=cls.other_facility
        )
        cls.other_coach.set_password(DUMMY_PASSWORD)
        cls.other_coach.save()
        cls.other_classroom.add_coach(cls.other_coach)

        cls.topic = ContentNode.objects.create(
            id=uuid.uuid4().hex,
            channel_id=uuid.uuid4().hex,
            content_id=uuid.uuid4().hex,
            available=True,
            title="Arithmetic",
            kind="topic",
        )

    def test_coach_can_assign_node_to_their_learner(self):
        self.client.login(username=self.coach.username, password=DUMMY_PASSWORD)
        response = self.client.post(
            reverse("kolibri:core:learnernodeassignment-list"),
            {"contentnode_id": self.topic.id, "learner": self.learner.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        assignment = LearnerNodeAssignment.objects.get(
            contentnode_id=self.topic.id, learner=self.learner
        )
        self.assertEqual(assignment.title, "Arithmetic")
        self.assertEqual(assignment.assigned_by, self.coach)

    def test_assigning_the_same_node_twice_is_idempotent(self):
        self.client.login(username=self.coach.username, password=DUMMY_PASSWORD)
        url = reverse("kolibri:core:learnernodeassignment-list")
        data = {"contentnode_id": self.topic.id, "learner": self.learner.id}
        self.assertEqual(
            self.client.post(url, data, format="json").status_code,
            status.HTTP_201_CREATED,
        )
        # Checking the same box again should not error.
        self.assertEqual(
            self.client.post(url, data, format="json").status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(
            LearnerNodeAssignment.objects.filter(
                contentnode_id=self.topic.id, learner=self.learner
            ).count(),
            1,
        )

    def test_unrelated_coach_cannot_assign_to_someone_elses_learner(self):
        self.client.login(username=self.other_coach.username, password=DUMMY_PASSWORD)
        response = self.client.post(
            reverse("kolibri:core:learnernodeassignment-list"),
            {"contentnode_id": self.topic.id, "learner": self.learner.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(
            LearnerNodeAssignment.objects.filter(
                contentnode_id=self.topic.id, learner=self.learner
            ).exists()
        )

    def test_coach_can_unassign_node_from_their_learner(self):
        LearnerNodeAssignment.objects.create(
            contentnode_id=self.topic.id,
            title="Arithmetic",
            learner=self.learner,
            assigned_by=self.coach,
        )
        self.client.login(username=self.coach.username, password=DUMMY_PASSWORD)
        response = self.client.delete(
            reverse("kolibri:core:learnernodeassignment-unassign"),
            {"contentnode_id": self.topic.id, "learner": self.learner.id},
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            LearnerNodeAssignment.objects.filter(
                contentnode_id=self.topic.id, learner=self.learner
            ).exists()
        )

    def test_unassigning_when_not_assigned_does_not_error(self):
        self.client.login(username=self.coach.username, password=DUMMY_PASSWORD)
        response = self.client.delete(
            reverse("kolibri:core:learnernodeassignment-unassign"),
            {"contentnode_id": self.topic.id, "learner": self.learner.id},
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_unrelated_coach_unassign_is_a_silent_no_op(self):
        """
        An unrelated coach's unassign request matches zero rows once scoped
        by filter_readable (KolibriAuthPermissionsFilter itself does not
        scope non-GET requests - see the comment in viewsets.py), so it
        succeeds as a no-op rather than leaking whether the assignment
        exists via a 403/404.
        """
        LearnerNodeAssignment.objects.create(
            contentnode_id=self.topic.id,
            title="Arithmetic",
            learner=self.learner,
            assigned_by=self.coach,
        )
        self.client.login(username=self.other_coach.username, password=DUMMY_PASSWORD)
        response = self.client.delete(
            reverse("kolibri:core:learnernodeassignment-unassign"),
            {"contentnode_id": self.topic.id, "learner": self.learner.id},
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        # Still assigned - the other coach's request did not touch it.
        self.assertTrue(
            LearnerNodeAssignment.objects.filter(
                contentnode_id=self.topic.id, learner=self.learner
            ).exists()
        )

    def test_coach_can_fetch_completion_for_their_learner(self):
        self.client.login(username=self.coach.username, password=DUMMY_PASSWORD)
        response = self.client.get(
            reverse("kolibri:core:learnernodeassignment-completion"),
            {"learner": self.learner.id, "node_ids": str(self.topic.id)},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(str(self.topic.id), response.data)

    def test_unrelated_coach_cannot_fetch_completion_for_someone_elses_learner(self):
        self.client.login(username=self.other_coach.username, password=DUMMY_PASSWORD)
        response = self.client.get(
            reverse("kolibri:core:learnernodeassignment-completion"),
            {"learner": self.learner.id, "node_ids": str(self.topic.id)},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_learner_can_read_their_own_assignments(self):
        LearnerNodeAssignment.objects.create(
            contentnode_id=self.topic.id,
            title="Arithmetic",
            learner=self.learner,
            assigned_by=self.coach,
        )
        self.client.login(username=self.learner.username, password=DUMMY_PASSWORD)
        response = self.client.get(reverse("kolibri:core:learnernodeassignment-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["contentnode_id"], str(self.topic.id))

    def test_learner_can_fetch_their_own_completion(self):
        self.client.login(username=self.learner.username, password=DUMMY_PASSWORD)
        response = self.client.get(
            reverse("kolibri:core:learnernodeassignment-completion"),
            {"learner": self.learner.id, "node_ids": str(self.topic.id)},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(str(self.topic.id), response.data)

    def test_learner_cannot_read_another_learners_assignments(self):
        other_learner = FacilityUser.objects.create(
            username="other_learner", facility=self.facility
        )
        other_learner.set_password(DUMMY_PASSWORD)
        other_learner.save()
        self.classroom.add_member(other_learner)
        LearnerNodeAssignment.objects.create(
            contentnode_id=self.topic.id,
            title="Arithmetic",
            learner=self.learner,
            assigned_by=self.coach,
        )
        self.client.login(username=other_learner.username, password=DUMMY_PASSWORD)
        response = self.client.get(reverse("kolibri:core:learnernodeassignment-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_learner_cannot_fetch_another_learners_completion(self):
        other_learner = FacilityUser.objects.create(
            username="other_learner", facility=self.facility
        )
        other_learner.set_password(DUMMY_PASSWORD)
        other_learner.save()
        self.classroom.add_member(other_learner)
        self.client.login(username=other_learner.username, password=DUMMY_PASSWORD)
        response = self.client.get(
            reverse("kolibri:core:learnernodeassignment-completion"),
            {"learner": self.learner.id, "node_ids": str(self.topic.id)},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_learner_cannot_assign_content_to_themself(self):
        self.client.login(username=self.learner.username, password=DUMMY_PASSWORD)
        response = self.client.post(
            reverse("kolibri:core:learnernodeassignment-list"),
            {"contentnode_id": self.topic.id, "learner": self.learner.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_learner_cannot_unassign_their_own_content(self):
        LearnerNodeAssignment.objects.create(
            contentnode_id=self.topic.id,
            title="Arithmetic",
            learner=self.learner,
            assigned_by=self.coach,
        )
        self.client.login(username=self.learner.username, password=DUMMY_PASSWORD)
        response = self.client.delete(
            reverse("kolibri:core:learnernodeassignment-unassign"),
            {"contentnode_id": self.topic.id, "learner": self.learner.id},
        )
        # unassign's manual filter_readable scoping shares can_be_deleted_by's
        # admin/coach-only scoping, so a learner's request matches zero rows -
        # a silent no-op (204), not an error, matching the existing
        # unrelated-coach no-op behavior above.
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertTrue(
            LearnerNodeAssignment.objects.filter(
                contentnode_id=self.topic.id, learner=self.learner
            ).exists()
        )
