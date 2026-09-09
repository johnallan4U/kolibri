<template>

  <div>
    <div style="display: flex; justify-content: space-between">
      <p>
        <BackLink
          :to="classRoute(PageNames.LEARNERS_ROOT)"
          :text="$tr('back')"
        />
      </p>
      <ReportsControls :disableExport="true" />
    </div>
    <h1>
      <KLabeledIcon
        icon="person"
        :label="learner.name"
      />
    </h1>
    <KGrid>
      <KGridItem
        :layout12="{ span: 6 }"
        style="margin-bottom: 16px"
      >
        <HeaderTable>
          <HeaderTableRow>
            <template #key>
              {{ coachString('classLabel') }}
            </template>
            <template #value>
              {{ className }}
            </template>
          </HeaderTableRow>
          <HeaderTableRow>
            <template #key>
              {{ coreString('usernameLabel') }}
            </template>
            <template #value>
              {{ learner.username }}
            </template>
          </HeaderTableRow>
          <HeaderTableRow v-if="picturePasswordSettings">
            <template #key>
              {{ coreString('passwordLabel') }}
            </template>
            <template #value>
              <UserPicturePassword
                v-if="learner.picture_password"
                :showIconText="picturePasswordSettings.show_icon_text"
                iconSize="32px"
                :picturePassword="learner.picture_password"
                :iconStyle="picturePasswordSettings.icon_style"
              />
              <KEmptyPlaceholder v-else />
            </template>
          </HeaderTableRow>
          <HeaderTableRow>
            <template #key>
              {{ coachString('groupsLabel') }}
            </template>
            <template #value>
              <TruncatedItemList :items="getGroupNamesForLearner(learner.id)" />
            </template>
          </HeaderTableRow>
        </HeaderTable>
      </KGridItem>
      <KGridItem :layout12="{ span: 3 }">
        <div :style="boxStyle">
          <p
            class="key"
            :style="{ color: $themeTokens.primary }"
          >
            {{ coachString('lessonsCompletedLabel') }}
          </p>
          <div class="value-box">
            <p class="value">{{ lessonsCompleted }}</p>
            <p
              v-if="learnerSummary.totalLessons > 0"
              style="display: inline; word-wrap: break-word"
            >
              {{ $tr('totalLessons', { total: learnerSummary.totalLessons }) }}
            </p>
          </div>
        </div>
      </KGridItem>
      <KGridItem :layout12="{ span: 3 }">
        <div :style="boxStyle">
          <p
            class="key"
            :style="{ color: $themeTokens.primary }"
          >
            {{ coachString('avgScoreLabel') }}
          </p>
          <div class="value-box">
            <p class="value">
              {{ $formatNumber(avgScore, { style: 'percent', maximumFractionDigits: 0 }) }}
            </p>
          </div>
        </div>
      </KGridItem>
      <KGridItem :layout12="{ span: 6 }" />
      <KGridItem :layout12="{ span: 3 }">
        <div :style="boxStyle">
          <p
            class="key"
            :style="{ color: $themeTokens.primary }"
          >
            {{ coachString('exercisesCompletedLabel') }}
          </p>
          <div class="value-box">
            <p class="value">{{ $formatNumber(exercisesCompleted) }}</p>
          </div>
        </div>
      </KGridItem>
      <KGridItem :layout12="{ span: 3 }">
        <div :style="boxStyle">
          <p
            class="key"
            :style="{ color: $themeTokens.primary }"
          >
            {{ coachString('resourcesViewedLabel') }}
          </p>
          <div class="value-box">
            <p class="value">{{ $formatNumber(resourcesViewed) }}</p>
          </div>
        </div>
      </KGridItem>
    </KGrid>
  </div>

</template>


<script>

  import commonCoreStrings from 'kolibri/uiText/commonCoreStrings';
  import UserPicturePassword from 'kolibri-common/components/UserPicturePassword';
  import useLearnerProgressSummary from '../../../composables/useLearnerProgressSummary';
  import commonCoach from '../../common';
  import ReportsControls from '../../common/ReportsControls';

  export default {
    name: 'LearnerHeader',
    components: {
      ReportsControls,
      UserPicturePassword,
    },
    mixins: [commonCoach, commonCoreStrings],
    setup() {
      const { getLearnerProgressSummary } = useLearnerProgressSummary();
      return { getLearnerProgressSummary };
    },
    computed: {
      picturePasswordSettings() {
        return this.$store.state.classSummary.picture_password_settings;
      },
      learner() {
        return this.learnerMap[this.$route.params.learnerId];
      },
      learnerSummary() {
        return this.getLearnerProgressSummary(this.learner.id);
      },
      lessonsCompleted() {
        return this.learnerSummary.lessonsCompleted;
      },
      avgScore() {
        return this.learnerSummary.avgScore;
      },
      exercisesCompleted() {
        return this.learnerSummary.exercisesCompleted;
      },
      resourcesViewed() {
        return this.learnerSummary.resourcesViewed;
      },
      boxStyle() {
        return {
          border: '1px solid',
          borderColor: this.$themePalette.grey.v_200,
          borderRadius: '4px',
          padding: '0px 16px',
          margin: '5px',
        };
      },
    },
    $trs: {
      back: {
        message: 'All learners',
        context:
          "Link that takes user back to the list of learners on the 'Reports' tab, from the individual learner's information page.",
      },
      totalLessons: 'of {total}',
    },
  };

</script>


<style lang="scss" scoped>

  .key {
    font-size: 14px;
  }

  .value-box {
    padding-bottom: 10px;
  }

  p.value {
    position: relative;
    display: inline;
    margin-right: 5px;
    margin-bottom: 0;
    font-size: 32px;
    word-wrap: break-word;
  }

</style>
