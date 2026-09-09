import { getCurrentInstance } from 'vue';
import get from 'lodash/get';
import meanBy from 'lodash/meanBy';
import { now } from 'kolibri/utils/serverClock';
import { STATUSES } from '../modules/classSummary/constants';

/**
 * Per-learner aggregate progress stats and schedule status, factored out of
 * duplicated logic previously in LearnerHeader.vue and LearnersRootPage.vue.
 * Reads from the already-loaded classSummary Vuex module; introduces no new
 * data source.
 */
export default function useLearnerProgressSummary(store) {
  store = store || getCurrentInstance().proxy.$store;

  function contentIdIsForExercise(contentId) {
    return get(store.state.classSummary.contentMap, [contentId, 'kind']) === 'exercise';
  }

  /**
   * @param {string} learnerId
   * @returns {Object} {
   *   lessonsCompleted, totalLessons, overallPercentComplete,
   *   avgScore, exercisesCompleted, resourcesViewed, isBehindSchedule,
   * }
   */
  function getLearnerProgressSummary(learnerId) {
    const learnerLessons = store.getters['classSummary/lessons'].filter(lesson =>
      store.getters['classSummary/getLearnersForLesson'](lesson).includes(learnerId),
    );
    const learnerLessonIds = learnerLessons.map(lesson => lesson.id);

    const lessonsCompleted = store.getters['classSummary/lessonStatuses'].filter(
      status =>
        status.learner_id === learnerId &&
        status.status === STATUSES.completed &&
        learnerLessonIds.includes(status.lesson_id),
    ).length;

    const examStatuses = store.getters['classSummary/examStatuses'].filter(
      status => status.learner_id === learnerId && status.status === STATUSES.completed,
    );

    const learnerContentStatuses = store.getters['classSummary/contentStatuses'].filter(
      status => status.learner_id === learnerId,
    );
    const exercisesCompleted = learnerContentStatuses.filter(
      status => contentIdIsForExercise(status.content_id) && status.status === STATUSES.completed,
    ).length;
    const resourcesViewed = learnerContentStatuses.filter(
      status => !contentIdIsForExercise(status.content_id) && status.status !== STATUSES.notStarted,
    ).length;

    // A learner is behind schedule if any lesson assigned to them is past
    // its due date and they haven't completed it yet.
    const isBehindSchedule = learnerLessons.some(
      lesson =>
        lesson.due_date &&
        lesson.due_date < now() &&
        store.getters['classSummary/getLessonStatusStringForLearner'](lesson.id, learnerId) !==
          STATUSES.completed,
    );

    return {
      lessonsCompleted,
      totalLessons: learnerLessons.length,
      overallPercentComplete: learnerLessons.length
        ? lessonsCompleted / learnerLessons.length
        : null,
      avgScore: examStatuses.length ? meanBy(examStatuses, 'score') : null,
      exercisesCompleted,
      resourcesViewed,
      isBehindSchedule,
    };
  }

  return { getLearnerProgressSummary };
}
