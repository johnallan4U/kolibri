<template>

  <CoachAppBarPage :loading="pageLoading">
    <KPageContainer>
      <div class="home-header">
        <h1>{{ coreString('homeLabel') }}</h1>
        <KButtonGroup>
          <KRouterLink
            :text="coachString('createLessonAction')"
            :to="newLessonRoute"
            appearance="raised-button"
          />
          <KRouterLink
            :text="coachString('newQuizAction')"
            :to="newExamRoute"
            appearance="raised-button"
          />
        </KButtonGroup>
      </div>

      <p v-if="!sortedLearners.length">
        {{ coachString('learnerListEmptyState') }}
      </p>
      <div
        v-for="learner in sortedLearners"
        :key="learner.id"
        class="learner-row"
      >
        <h2>{{ learner.name }}</h2>
        <KButtonGroup>
          <KRouterLink
            :text="$tr('assignedWorkAction')"
            :to="classRoute(PageNames.LEARNER_SUMMARY, { learnerId: learner.id })"
            appearance="basic-link"
          />
          <KRouterLink
            :text="$tr('progressAction')"
            :to="classRoute(PageNames.LEARNER_SUMMARY, { learnerId: learner.id })"
            appearance="basic-link"
          />
          <KButton
            :text="$tr('rescheduleWorkAction')"
            appearance="basic-link"
            @click="rescheduleLearner = learner"
          />
          <KExternalLink
            :text="coreString('settingsLabel')"
            :href="settingsUrl(learner.id)"
            appearance="basic-link"
          />
        </KButtonGroup>
      </div>
    </KPageContainer>

    <RescheduleWorkModal
      v-if="rescheduleLearner"
      :learnerId="rescheduleLearner.id"
      :learnerName="rescheduleLearner.name"
      @cancel="rescheduleLearner = null"
      @success="handleRescheduleSuccess"
    />
  </CoachAppBarPage>

</template>


<script>

  import sortBy from 'lodash/sortBy';
  import urls from 'kolibri/urls';
  import commonCoreStrings from 'kolibri/uiText/commonCoreStrings';
  import { pageLoading } from 'kolibri-common/composables/usePageLoading';
  import CoachAppBarPage from '../../CoachAppBarPage';
  import commonCoach from '../../common';
  import { PageNames } from '../../../constants';
  import RescheduleWorkModal from '../RescheduleWorkModal';

  export default {
    name: 'HomePage',
    components: {
      CoachAppBarPage,
      RescheduleWorkModal,
    },
    mixins: [commonCoach, commonCoreStrings],
    setup() {
      return { pageLoading, PageNames };
    },
    data() {
      return {
        // The learner currently being rescheduled, or null when the modal
        // is closed.
        rescheduleLearner: null,
      };
    },
    computed: {
      sortedLearners() {
        return sortBy(this.learners, ['name']);
      },
      newLessonRoute() {
        return {
          name: PageNames.LESSON_CREATION_ROOT,
          params: { classId: this.classId },
        };
      },
      newExamRoute() {
        return {
          name: PageNames.EXAM_CREATION_ROOT,
          params: { classId: this.classId, sectionIndex: 0, quizId: 'new' },
        };
      },
    },
    methods: {
      settingsUrl(learnerId) {
        const facilityUrl = urls['kolibri:kolibri.plugins.facility:facility_management'];
        if (!facilityUrl) {
          return '';
        }
        const facilityId = this.$store.state.classSummary.facility_id;
        return `${facilityUrl()}#/${facilityId}/users/${learnerId}`;
      },
      handleRescheduleSuccess() {
        this.rescheduleLearner = null;
        this.showSnackbarNotification('changesSaved');
      },
    },
    $trs: {
      assignedWorkAction: {
        message: 'Assigned work',
        context: "Link to a learner's assigned lessons and quizzes.",
      },
      progressAction: {
        message: 'Progress',
        context: "Link to a learner's completion and score progress.",
      },
      rescheduleWorkAction: {
        message: 'Reschedule work',
        context: "Opens a dialog to change the due dates of a learner's assigned lessons.",
      },
    },
  };

</script>


<style lang="scss" scoped>

  .home-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .learner-row {
    padding: 16px 0;
    border-top: 1px solid;
  }

</style>
