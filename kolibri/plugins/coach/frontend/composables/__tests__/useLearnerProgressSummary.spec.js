import useLearnerProgressSummary from '../useLearnerProgressSummary';
import makeStore from '../../__tests__/utils/makeStore';

function makeStoreWithClassSummary(overrides) {
  const store = makeStore();
  Object.assign(store.state.classSummary, {
    id: 'class-1',
    learnerMap: {
      'learner-1': { id: 'learner-1', name: 'Learner One' },
    },
    groupMap: {},
    lessonMap: {},
    ...overrides,
  });
  return store;
}

describe('useLearnerProgressSummary', () => {
  it('reports zero lessons and no schedule risk when nothing is assigned', () => {
    const store = makeStoreWithClassSummary();
    const { getLearnerProgressSummary } = useLearnerProgressSummary(store);

    const summary = getLearnerProgressSummary('learner-1');

    expect(summary.totalLessons).toBe(0);
    expect(summary.lessonsCompleted).toBe(0);
    expect(summary.overallPercentComplete).toBeNull();
    expect(summary.isBehindSchedule).toBe(false);
  });

  it('flags a learner as behind schedule when an assigned lesson is overdue and incomplete', () => {
    const store = makeStoreWithClassSummary({
      lessonMap: {
        'lesson-1': {
          id: 'lesson-1',
          assignments: ['class-1'], // assigned to the whole class
          learner_ids: [],
          node_ids: [], // no resources -> status can only be 'notStarted'
          due_date: new Date('2000-01-01'),
          start_date: null,
        },
      },
    });
    const { getLearnerProgressSummary } = useLearnerProgressSummary(store);

    const summary = getLearnerProgressSummary('learner-1');

    expect(summary.totalLessons).toBe(1);
    expect(summary.lessonsCompleted).toBe(0);
    expect(summary.overallPercentComplete).toBe(0);
    expect(summary.isBehindSchedule).toBe(true);
  });

  it('does not flag a learner as behind schedule when the overdue lesson has no due date', () => {
    const store = makeStoreWithClassSummary({
      lessonMap: {
        'lesson-1': {
          id: 'lesson-1',
          assignments: ['class-1'],
          learner_ids: [],
          node_ids: [],
          due_date: null,
          start_date: null,
        },
      },
    });
    const { getLearnerProgressSummary } = useLearnerProgressSummary(store);

    expect(getLearnerProgressSummary('learner-1').isBehindSchedule).toBe(false);
  });

  it('does not flag a learner as behind schedule when the lesson is not due yet', () => {
    const farFuture = new Date();
    farFuture.setFullYear(farFuture.getFullYear() + 1);
    const store = makeStoreWithClassSummary({
      lessonMap: {
        'lesson-1': {
          id: 'lesson-1',
          assignments: ['class-1'],
          learner_ids: [],
          node_ids: [],
          due_date: farFuture,
          start_date: null,
        },
      },
    });
    const { getLearnerProgressSummary } = useLearnerProgressSummary(store);

    expect(getLearnerProgressSummary('learner-1').isBehindSchedule).toBe(false);
  });

  it('only counts lessons actually assigned to the given learner', () => {
    const store = makeStoreWithClassSummary({
      groupMap: {
        'group-1': { id: 'group-1', name: 'Group 1', member_ids: ['someone-else'] },
      },
      lessonMap: {
        'lesson-1': {
          id: 'lesson-1',
          assignments: ['group-1'], // not learner-1's group
          learner_ids: [],
          node_ids: [],
          due_date: new Date('2000-01-01'),
          start_date: null,
        },
      },
    });
    const { getLearnerProgressSummary } = useLearnerProgressSummary(store);

    const summary = getLearnerProgressSummary('learner-1');
    expect(summary.totalLessons).toBe(0);
    expect(summary.isBehindSchedule).toBe(false);
  });
});
