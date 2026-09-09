<template>

  <span
    v-if="behindSchedule"
    class="risk-badge risk-badge-wide"
    :style="{
      backgroundColor: $themeTokens.error,
      borderColor: $themeTokens.error,
      color: $themeTokens.textInverted,
    }"
  >
    <KIcon
      icon="error"
      :color="$themeTokens.textInverted"
      class="badge-icon"
    />
    {{ behindScheduleLabel$() }}
  </span>
  <span
    v-else
    class="risk-badge"
    :style="{
      backgroundColor: $themeTokens.success,
      borderColor: $themeTokens.success,
      color: $themeTokens.textInverted,
    }"
  >
    <KIcon
      icon="correct"
      :color="$themeTokens.textInverted"
      class="badge-icon"
    />
    {{ onTrackLabel$() }}
  </span>

</template>


<script>

  import { coursesStrings } from 'kolibri-common/strings/coursesStrings';
  import { coachStrings } from '../commonCoachStrings';

  // A simple two-state version of the risk-badge pattern from
  // views/courses/LearnersReport.vue (which has three tiers for pre/post-test
  // performance) - kept as a shared component so a third copy of this same
  // badge markup doesn't appear if another status badge is needed later.
  export default {
    name: 'BehindScheduleBadge',
    setup() {
      const { onTrackLabel$ } = coursesStrings;
      const { behindScheduleLabel$ } = coachStrings;
      return { onTrackLabel$, behindScheduleLabel$ };
    },
    props: {
      behindSchedule: {
        type: Boolean,
        required: true,
      },
    },
  };

</script>


<style scoped>

  .risk-badge {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    padding: 5px 14px 5px 10px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    border: 1px solid;
    border-radius: 16px;
  }

  .risk-badge-wide {
    min-width: 160px;
  }

  .badge-icon {
    width: 16px;
    height: 16px;
  }

</style>
