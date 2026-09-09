import { registerNavItem } from 'kolibri/composables/useNav';
import urls from 'kolibri/urls';
import useUser from 'kolibri/composables/useUser';
import { coreStrings } from 'kolibri/uiText/commonCoreStrings';
import baseRoutes from '../routes/baseRoutes';
import useDeviceSettings from '../composables/useDeviceSettings';
import { learnStrings } from './commonLearnStrings';

registerNavItem({
  get url() {
    return urls['kolibri:kolibri.plugins.learn:learn']();
  },
  get routes() {
    const { isUserLoggedIn } = useUser();
    if (!isUserLoggedIn.value) {
      return [];
    }
    const routes = [
      {
        label: coreStrings.$tr('homeLabel'),
        icon: 'dashboard',
        route: baseRoutes.home.path,
        name: baseRoutes.home.name,
      },
    ];
    // The Library tab is just a dead end once free browsing is turned off
    // (unassignedContentGuard already redirects away from it in that case)
    // - omit it entirely rather than show a tab that bounces the learner
    // back to Home.
    const { canAccessUnassignedContent } = useDeviceSettings();
    if (canAccessUnassignedContent.value) {
      routes.push({
        label: coreStrings.$tr('libraryLabel'),
        icon: 'library',
        route: baseRoutes.library.path,
        name: baseRoutes.library.name,
      });
    }
    routes.push({
      label: coreStrings.$tr('bookmarksLabel'),
      icon: 'bookmark',
      route: baseRoutes.bookmarks.path,
      name: baseRoutes.bookmarks.name,
    });
    return routes;
  },
  get label() {
    return learnStrings.$tr('learnLabel');
  },
  icon: 'learn',
  bottomBar: true,
});
