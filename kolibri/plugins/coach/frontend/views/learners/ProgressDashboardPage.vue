<template>

  <CoachAppBarPage :loading="pageLoading">
    <KPageContainer>
      <CoachHeader :title="coachString('progressDashboardLabel')" />
      <KCardGrid
        v-if="learnerCards.length"
        layout="1-2-3"
        :layoutOverride="[{ columnGap: '16px', rowGap: '16px' }]"
      >
        <KCard
          v-for="learner in learnerCards"
          :key="learner.id"
          :to="classRoute(PageNames.LEARNER_SUMMARY, { learnerId: learner.id })"
          :title="learner.name"
          :headingLevel="3"
        >
          <template #footer>
            <div class="progress-footer">
              <p
                class="percent"
                :style="{ color: $themeTokens.primary }"
              >
                {{
                  $formatNumber(learner.summary.overallPercentComplete || 0, {
                    style: 'percent',
                    maximumFractionDigits: 0,
                  })
                }}
              </p>
              <p class="lessons-count">
                {{
                  $tr('lessonsCompletedOfTotal', {
                    completed: learner.summary.lessonsCompleted,
                    total: learner.summary.totalLessons,
                  })
                }}
              </p>
              <BehindScheduleBadge :behindSchedule="learner.summary.isBehindSchedule" />
            </div>
          </template>
        </KCard>
      </KCardGrid>
      <p v-else>
        {{ coachString('learnerListEmptyState') }}
      </p>
    </KPageContainer>
  </CoachAppBarPage>

</template>


<script>

  import sortBy from 'lodash/sortBy';
  import { pageLoading } from 'kolibri-common/composables/usePageLoading';
  import useLearnerProgressSummary from '../../composables/useLearnerProgressSummary';
  import commonCoach from '../common';
  import CoachAppBarPage from '../CoachAppBarPage';
  import CoachHeader from '../common/CoachHeader';
  import BehindScheduleBadge from '../common/status/BehindScheduleBadge';
  import { PageNames } from '../../constants';

  export default {
    name: 'ProgressDashboardPage',
    components: {
      CoachAppBarPage,
      CoachHeader,
      BehindScheduleBadge,
    },
    mixins: [commonCoach],
    setup() {
      const { getLearnerProgressSummary } = useLearnerProgressSummary();
      return { pageLoading, getLearnerProgressSummary, PageNames };
    },
    computed: {
      learnerCards() {
        return sortBy(this.learners, ['name']).map(learner => ({
          ...learner,
          summary: this.getLearnerProgressSummary(learner.id),
        }));
      },
    },
    $trs: {
      lessonsCompletedOfTotal: {
        message: '{completed, number} of {total, number} lessons complete',
        context:
          "Shown on a learner's progress card, summarizing how many of their assigned lessons they have finished.",
      },
    },
  };

</script>


<style lang="scss" scoped>

  .progress-footer {
    padding-top: 8px;
  }

  .percent {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
  }

  .lessons-count {
    margin: 0 0 8px;
    font-size: 13px;
  }

</style>
