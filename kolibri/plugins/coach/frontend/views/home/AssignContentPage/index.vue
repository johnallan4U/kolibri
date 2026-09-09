<template>

  <CoachAppBarPage :loading="pageLoading">
    <KPageContainer>
      <h1>{{ $tr('pageTitle', { name: learnerName }) }}</h1>
      <nav
        class="breadcrumbs"
        :aria-label="$tr('breadcrumbsLabel')"
      >
        <KButton
          :text="$tr('allChannelsLabel')"
          appearance="basic-link"
          @click="goToBreadcrumb(-1)"
        />
        <template v-for="(crumb, index) in breadcrumbs">
          <span :key="`sep-${crumb.id}`"> / </span>
          <KButton
            :key="crumb.id"
            :text="crumb.title"
            appearance="basic-link"
            @click="goToBreadcrumb(index)"
          />
        </template>
      </nav>
      <KCircularLoader v-if="loading" />
      <template v-else>
        <p v-if="!nodes.length">
          {{ $tr('emptyMessage') }}
        </p>
        <AssignContentNodeRow
          v-for="node in nodes"
          :key="node.id"
          :node="node"
          :assignedViaAncestor="hasAssignedAncestor"
          @toggle="toggleAssignment"
          @open="openNode"
        />
      </template>
    </KPageContainer>
  </CoachAppBarPage>

</template>


<script>

  import { useRoute } from 'vue-router/composables';
  import { ContentNodeKinds } from 'kolibri/constants';
  import { pageLoading } from 'kolibri-common/composables/usePageLoading';
  import useAssignContentTree from '../../../composables/useAssignContentTree';
  import CoachAppBarPage from '../../CoachAppBarPage';
  import commonCoach from '../../common';
  import AssignContentNodeRow from './AssignContentNodeRow';

  export default {
    name: 'AssignContentPage',
    components: {
      CoachAppBarPage,
      AssignContentNodeRow,
    },
    mixins: [commonCoach],
    setup() {
      const route = useRoute();
      const treeApi = useAssignContentTree(route.params.learnerId);
      return { pageLoading, ...treeApi };
    },
    computed: {
      learnerName() {
        return this.learnerMap[this.$route.params.learnerId]?.name || '';
      },
      // Any topic on the current breadcrumb trail that's directly assigned
      // means everything below it is implicitly assigned too (see
      // AssignContentNodeRow's docs on assignedViaAncestor).
      hasAssignedAncestor() {
        return this.breadcrumbs.some(crumb => crumb.assigned);
      },
    },
    created() {
      // pageLoading (the page-shell spinner) is cleared by the route
      // handler already; this component's own `loading` ref drives its
      // in-page spinner while the channel list fetches.
      this.showChannels();
    },
    methods: {
      openNode(node) {
        if (node.kind !== ContentNodeKinds.TOPIC && node.kind !== ContentNodeKinds.CHANNEL) {
          return;
        }
        this.showTopic(node.id, { title: node.title, assigned: Boolean(node.assigned) });
      },
    },
    $trs: {
      pageTitle: {
        message: 'Assign work to {name}',
        context: 'Title of the page where a coach browses content to assign to one learner.',
      },
      allChannelsLabel: {
        message: 'All channels',
        context: 'Breadcrumb link back to the top-level list of channels.',
      },
      breadcrumbsLabel: {
        message: 'Content location',
        context: 'Accessible label for the breadcrumb trail while browsing content to assign.',
      },
      emptyMessage: {
        message: 'Nothing here',
        context: 'Shown when a topic has no channels/resources to display.',
      },
    },
  };

</script>


<style lang="scss" scoped></style>
