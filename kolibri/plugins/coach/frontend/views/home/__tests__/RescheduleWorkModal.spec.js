import { mount } from '@vue/test-utils';
import LessonResource from 'kolibri-common/apiResources/LessonResource';
import makeStore from '../../../__tests__/utils/makeStore';
import RescheduleWorkModal from '../RescheduleWorkModal.vue';

jest.mock('kolibri-common/apiResources/LessonResource', () => ({
  __esModule: true,
  default: {
    saveModel: jest.fn(() => Promise.resolve()),
  },
}));
jest.mock('kolibri/composables/useSnackbar');

function makeWrapper() {
  const store = makeStore();
  Object.assign(store.state.classSummary, {
    id: 'class-1',
    learnerMap: {
      'learner-1': { id: 'learner-1', name: 'Learner One' },
    },
    groupMap: {},
    lessonMap: {
      'lesson-1': {
        id: 'lesson-1',
        title: 'Reading 1',
        assignments: ['class-1'],
        learner_ids: [],
        node_ids: [],
        due_date: new Date('2026-09-08T23:59:59Z'),
        start_date: null,
      },
    },
  });
  return mount(RescheduleWorkModal, {
    store,
    propsData: { learnerId: 'learner-1', learnerName: 'Learner One' },
  });
}

describe('RescheduleWorkModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saves the new due date for a changed lesson', async () => {
    const wrapper = makeWrapper();
    const dateField = wrapper.findComponent({ name: 'KTextbox' });

    dateField.vm.$emit('input', '2026-12-25');
    await wrapper.vm.handleSubmit();

    expect(LessonResource.saveModel).toHaveBeenCalledWith({
      id: 'lesson-1',
      data: { due_date: '2026-12-25T23:59:59' },
    });
    expect(wrapper.emitted().success).toBeTruthy();
  });

  it('does not save anything when no date was changed', async () => {
    const wrapper = makeWrapper();

    await wrapper.vm.handleSubmit();

    expect(LessonResource.saveModel).not.toHaveBeenCalled();
    expect(wrapper.emitted().success).toBeTruthy();
  });
});
