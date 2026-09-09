import { render, screen } from '@testing-library/vue';
import '@testing-library/jest-dom';
import AssignedContentCards from '../AssignedContentCards.vue';

jest.mock('kolibri-common/composables/useChannels');
jest.mock('../../../composables/useContentLink');

const ONE_ITEM_COMPLETED_TEXT = '1 item completed';

function makeNode(overrides = {}) {
  return {
    id: 'node-1',
    title: 'Some Node',
    channel_id: 'channel-1',
    is_leaf: true,
    completedCount: 0,
    totalCount: 0,
    ...overrides,
  };
}

// Grouping/completion logic itself is covered directly, without any Vue
// rendering, in useAssignedContentGrouping.spec.js. These tests only cover
// what's left: the empty/all-complete states, and whether the "completed"
// accordion shows up - none of which render a ResourceCard, so none of
// them hit KCardGrid's mount-then-nextTick gate or need a router.
function renderCards(contentNodes) {
  return render(AssignedContentCards, { props: { contentNodes } });
}

describe('AssignedContentCards', () => {
  it('shows the empty-state message when nothing has ever been assigned', () => {
    renderCards([]);
    expect(
      screen.getByText(AssignedContentCards.$trs.noAssignedContentMessage.message),
    ).toBeInTheDocument();
  });

  it('shows the all-complete message when everything assigned is done', () => {
    renderCards([makeNode({ id: 'done-1', completedCount: 5, totalCount: 5 })]);
    expect(
      screen.getByText(AssignedContentCards.$trs.allCompleteMessage.message),
    ).toBeInTheDocument();
  });

  it('shows a "completed" accordion trigger once something is done', () => {
    renderCards([makeNode({ id: 'done-1', completedCount: 5, totalCount: 5 })]);
    expect(screen.getByText(ONE_ITEM_COMPLETED_TEXT)).toBeInTheDocument();
  });

  it('does not show a completed accordion when nothing has ever been assigned', () => {
    renderCards([]);
    expect(screen.queryByText(ONE_ITEM_COMPLETED_TEXT)).not.toBeInTheDocument();
  });
});
