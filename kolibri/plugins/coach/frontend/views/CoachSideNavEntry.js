import { registerNavItem } from 'kolibri/composables/useNav';
import urls from 'kolibri/urls';
import { coreStrings } from 'kolibri/uiText/commonCoreStrings';
import { UserKinds } from 'kolibri/constants';
import plugin_data from 'kolibri-plugin-data';
import { coursesStrings } from 'kolibri-common/strings/coursesStrings';
import baseRoutes from '../routes/baseRoutes';

registerNavItem({
  get url() {
    return urls['kolibri:kolibri.plugins.coach:coach']();
  },
  get routes() {
    // Simplified for a homeschool/family setup: only Home is shown in the
    // sidebar. Lessons/Quizzes/Learners/Groups routes still exist and are
    // still reachable (e.g. the "+ Assign new work" actions on Home route
    // into Lesson/Quiz creation) - only their own sidebar tabs are hidden.
    const _routes = [
      {
        label: coreStrings.$tr('classHome'),
        route: baseRoutes.classHome.path,
        icon: 'dashboard',
        name: baseRoutes.classHome.name,
      },
    ];

    if (plugin_data.courses_exist) {
      // Insert 'Courses' nav item just after 'Class Home'
      _routes.splice(1, 0, {
        label: coursesStrings.$tr('coursesLabel'),
        route: baseRoutes.courses.path,
        icon: 'lesson',
        name: baseRoutes.courses.name,
      });
    }

    return _routes;
  },
  get label() {
    return coreStrings.$tr('coachLabel');
  },
  icon: 'coach',
  role: UserKinds.COACH,
  fullFacilityOnly: true,
});
