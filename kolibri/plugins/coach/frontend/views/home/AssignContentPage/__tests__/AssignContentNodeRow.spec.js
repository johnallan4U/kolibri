import { render, screen, fireEvent } from '@testing-library/vue';
import '@testing-library/jest-dom';
import AssignContentNodeRow from '../AssignContentNodeRow.vue';

const CHANNEL_TITLE = 'Khan Academy';
const RESOURCE_TITLE = 'Some Video';
const TOPIC_TITLE = 'Arithmetic';

function renderRow(node, props = {}) {
  return render(AssignContentNodeRow, { props: { node, ...props } });
}

describe('AssignContentNodeRow', () => {
  it('shows a plain link for a channel row, with no checkbox', () => {
    renderRow({ id: 'channel-1', title: CHANNEL_TITLE, isChannel: true });
    expect(screen.getByText(CHANNEL_TITLE)).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('reflects an assigned resource as checked', () => {
    renderRow({
      id: 'node-1',
      title: RESOURCE_TITLE,
      kind: 'video',
      assigned: true,
      totalCount: 0,
    });
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('reflects an unassigned resource as unchecked', () => {
    renderRow({
      id: 'node-1',
      title: RESOURCE_TITLE,
      kind: 'video',
      assigned: false,
      totalCount: 0,
    });
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('emits toggle when the checkbox is clicked', async () => {
    const { emitted } = renderRow({
      id: 'node-1',
      title: RESOURCE_TITLE,
      kind: 'video',
      assigned: false,
      totalCount: 0,
    });
    await fireEvent.click(screen.getByRole('checkbox'));
    expect(emitted().toggle).toBeTruthy();
  });

  it('shows a checked, disabled checkbox when assigned via an ancestor', () => {
    renderRow(
      { id: 'node-1', title: RESOURCE_TITLE, kind: 'video', assigned: false, totalCount: 0 },
      { assignedViaAncestor: true },
    );
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
    expect(checkbox).toBeDisabled();
  });

  it('shows a Browse action for a topic but not for a leaf resource', () => {
    renderRow({
      id: 'topic-1',
      title: TOPIC_TITLE,
      kind: 'topic',
      assigned: false,
      totalCount: 0,
    });
    expect(screen.getByText(AssignContentNodeRow.$trs.browseAction.message)).toBeInTheDocument();
  });

  it('shows completion counts when totalCount is greater than zero', () => {
    renderRow({
      id: 'topic-1',
      title: TOPIC_TITLE,
      kind: 'topic',
      assigned: false,
      completedCount: 3,
      totalCount: 10,
    });
    expect(screen.getByTestId('completion')).toHaveTextContent('3/10');
  });

  it('does not show a completion count when totalCount is zero', () => {
    renderRow({
      id: 'node-1',
      title: RESOURCE_TITLE,
      kind: 'video',
      assigned: false,
      completedCount: 0,
      totalCount: 0,
    });
    expect(screen.queryByTestId('completion')).not.toBeInTheDocument();
  });
});
