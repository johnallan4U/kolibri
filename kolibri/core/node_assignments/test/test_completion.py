import uuid
from unittest import mock

from django.test import TestCase
from django.utils import timezone

from kolibri.core.auth.models import Facility
from kolibri.core.auth.models import FacilityUser
from kolibri.core.auth.test.helpers import provision_device
from kolibri.core.content.models import ContentNode
from kolibri.core.logger.models import ContentSummaryLog
from kolibri.core.node_assignments.completion import get_completion_for_nodes
from kolibri.core.node_assignments.models import LearnerNodeAssignment


class GetCompletionForNodesTestCase(TestCase):
    databases = "__all__"

    @classmethod
    def setUpTestData(cls):
        provision_device()
        cls.facility = Facility.objects.create(name="TestFacility")
        cls.learner = FacilityUser.objects.create(
            username="learner", facility=cls.facility
        )

        channel_id = uuid.uuid4().hex
        # A single shared channel root, matching real content structure
        # (ChannelMetadata.root) - MPTT assigns a fresh tree_id per root
        # node, and get_descendant_content_ids() doesn't filter by
        # tree_id, so two independent root nodes can have colliding
        # lft/rght ranges. Nesting everything under one root avoids that
        # entirely, the same way real imported channel content does.
        cls.channel_root = ContentNode.objects.create(
            id=uuid.uuid4().hex,
            channel_id=channel_id,
            content_id=uuid.uuid4().hex,
            available=True,
            title="Channel Root",
            kind="topic",
        )
        cls.topic = ContentNode.objects.create(
            id=uuid.uuid4().hex,
            channel_id=channel_id,
            content_id=uuid.uuid4().hex,
            parent=cls.channel_root,
            available=True,
            title="Arithmetic",
            kind="topic",
        )
        cls.leaves = [
            ContentNode.objects.create(
                id=uuid.uuid4().hex,
                channel_id=channel_id,
                content_id=uuid.uuid4().hex,
                parent=cls.topic,
                available=True,
                title="Leaf {}".format(i),
                kind="exercise",
            )
            for i in range(5)
        ]
        cls.leaf_resource = ContentNode.objects.create(
            id=uuid.uuid4().hex,
            channel_id=channel_id,
            content_id=uuid.uuid4().hex,
            parent=cls.channel_root,
            available=True,
            title="Standalone Video",
            kind="video",
        )

    def _complete(self, leaf):
        ContentSummaryLog.objects.create(
            user=self.learner,
            content_id=leaf.content_id,
            channel_id=leaf.channel_id,
            kind=leaf.kind,
            progress=1.0,
            start_timestamp=timezone.now(),
        )

    def test_unassigned_topic_reports_not_assigned_with_correct_total(self):
        result = get_completion_for_nodes([self.topic.id], self.learner.id)
        self.assertEqual(
            result[str(self.topic.id)],
            {"assigned": False, "completed_count": 0, "total_count": 5},
        )

    def test_assigned_topic_reports_partial_completion(self):
        LearnerNodeAssignment.objects.create(
            contentnode_id=self.topic.id, title="Arithmetic", learner=self.learner
        )
        self._complete(self.leaves[0])
        self._complete(self.leaves[1])
        self._complete(self.leaves[2])

        result = get_completion_for_nodes([self.topic.id], self.learner.id)

        self.assertEqual(
            result[str(self.topic.id)],
            {"assigned": True, "completed_count": 3, "total_count": 5},
        )

    def test_leaf_resource_has_total_count_of_one(self):
        result = get_completion_for_nodes([self.leaf_resource.id], self.learner.id)
        self.assertEqual(
            result[str(self.leaf_resource.id)],
            {"assigned": False, "completed_count": 0, "total_count": 1},
        )
        self._complete(self.leaf_resource)
        result = get_completion_for_nodes([self.leaf_resource.id], self.learner.id)
        self.assertEqual(result[str(self.leaf_resource.id)]["completed_count"], 1)

    def test_batches_multiple_nodes_in_one_call(self):
        result = get_completion_for_nodes(
            [self.topic.id, self.leaf_resource.id], self.learner.id
        )
        self.assertEqual(
            set(result.keys()), {str(self.topic.id), str(self.leaf_resource.id)}
        )

    def test_chunks_large_descendant_lists_instead_of_one_giant_query(self):
        """
        With the IN-clause chunk size patched down to 2, a topic with 5
        leaves must be queried in multiple chunks - confirms _completed_count
        actually iterates chunks rather than passing everything in one
        unbounded IN(...) query.
        """
        self._complete(self.leaves[0])
        self._complete(self.leaves[3])

        # 1 (assigned_ids) + 1 (ContentNode fetch) + 1 (descendant content_ids)
        # + 3 chunked ContentSummaryLog counts (ceil(5 leaves / 2) chunks) = 6.
        with mock.patch("kolibri.core.node_assignments.completion._IN_CHUNK_SIZE", 2):
            with self.assertNumQueries(6):
                result = get_completion_for_nodes([self.topic.id], self.learner.id)

        self.assertEqual(result[str(self.topic.id)]["completed_count"], 2)
