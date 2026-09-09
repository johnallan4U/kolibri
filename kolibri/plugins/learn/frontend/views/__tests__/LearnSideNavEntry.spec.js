import { registerNavItem } from 'kolibri/composables/useNav';
import useUser from 'kolibri/composables/useUser';
import useDeviceSettings from '../../composables/useDeviceSettings';
import '../LearnSideNavEntry';

jest.mock('kolibri/composables/useNav', () => ({ registerNavItem: jest.fn() }));
jest.mock('kolibri/composables/useUser');
jest.mock('../../composables/useDeviceSettings');
jest.mock('kolibri/urls');

// '../LearnSideNavEntry' calls registerNavItem({ ...routes getter... }) once,
// at import time (above) - the object it passed is captured once here, and
// each test just changes the useUser/useDeviceSettings mocks and re-reads
// the `routes` getter, which evaluates those composables fresh every access.
function getRegisteredRoutes() {
  const [config] = registerNavItem.mock.calls[0];
  return config.routes;
}

describe('LearnSideNavEntry', () => {
  it('includes the Library tab when unassigned content access is allowed', () => {
    useUser.mockImplementation(() => ({ isUserLoggedIn: { value: true } }));
    useDeviceSettings.mockImplementation(() => ({
      canAccessUnassignedContent: { value: true },
    }));

    const routeNames = getRegisteredRoutes().map(route => route.name);
    expect(routeNames).toContain('LIBRARY');
  });

  it('omits the Library tab when unassigned content access is not allowed', () => {
    useUser.mockImplementation(() => ({ isUserLoggedIn: { value: true } }));
    useDeviceSettings.mockImplementation(() => ({
      canAccessUnassignedContent: { value: false },
    }));

    const routeNames = getRegisteredRoutes().map(route => route.name);
    expect(routeNames).not.toContain('LIBRARY');
    // Home and Bookmarks are still there - only Library is gated.
    expect(routeNames).toContain('HOME');
    expect(routeNames).toContain('BOOKMARKS');
  });

  it('returns no routes at all for a guest (not logged in)', () => {
    useUser.mockImplementation(() => ({ isUserLoggedIn: { value: false } }));
    useDeviceSettings.mockImplementation(() => ({
      canAccessUnassignedContent: { value: true },
    }));

    expect(getRegisteredRoutes()).toEqual([]);
  });
});
