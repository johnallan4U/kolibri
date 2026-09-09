import { render, screen } from '@testing-library/vue';
import '@testing-library/jest-dom';
import { coursesStrings } from 'kolibri-common/strings/coursesStrings';
import { coachStrings } from '../../commonCoachStrings';
import BehindScheduleBadge from '../BehindScheduleBadge.vue';

const { onTrackLabel$ } = coursesStrings;
const { behindScheduleLabel$ } = coachStrings;

describe('BehindScheduleBadge', () => {
  it('shows the behind-schedule label when behindSchedule is true', () => {
    render(BehindScheduleBadge, { props: { behindSchedule: true } });
    expect(screen.getByText(behindScheduleLabel$())).toBeInTheDocument();
    expect(screen.queryByText(onTrackLabel$())).not.toBeInTheDocument();
  });

  it('shows the on-track label when behindSchedule is false', () => {
    render(BehindScheduleBadge, { props: { behindSchedule: false } });
    expect(screen.getByText(onTrackLabel$())).toBeInTheDocument();
    expect(screen.queryByText(behindScheduleLabel$())).not.toBeInTheDocument();
  });
});
