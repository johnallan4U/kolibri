import LessonResource from 'kolibri-common/apiResources/LessonResource';
import LessonEditDetailsPage from '../index.vue';

jest.mock('kolibri-common/apiResources/LessonResource', () => ({
  __esModule: true,
  default: {
    fetchModel: jest.fn(),
    saveModel: jest.fn(() => Promise.resolve()),
  },
}));

describe('LessonEditDetailsPage handleSaveChanges', () => {
  // Regression test: this method used to build its `data` payload from a
  // hardcoded list of fields, so any field not in that list (like start_date/
  // due_date) was silently dropped on save even though the form collected it.
  it('forwards edited start_date/due_date to LessonResource.saveModel', () => {
    const fakeThis = {
      $route: { params: { lessonId: 'lesson-1' } },
      disabled: false,
      goBackToSummaryPage: jest.fn(() => Promise.resolve()),
      showSnackbarNotification: jest.fn(),
      createSnackbar: jest.fn(),
      $tr: jest.fn(),
    };

    LessonEditDetailsPage.methods.handleSaveChanges.call(fakeThis, {
      title: 'Lesson 1',
      description: '',
      assignments: [],
      learner_ids: [],
      start_date: '2026-09-08T00:00:00',
      due_date: '2026-09-15T23:59:59',
    });

    expect(LessonResource.saveModel).toHaveBeenCalledWith({
      id: 'lesson-1',
      data: expect.objectContaining({
        start_date: '2026-09-08T00:00:00',
        due_date: '2026-09-15T23:59:59',
      }),
    });
  });
});
