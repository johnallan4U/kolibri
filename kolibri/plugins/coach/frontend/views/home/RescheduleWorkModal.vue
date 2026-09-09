<template>

  <KModal
    :title="$tr('modalTitle', { name: learnerName })"
    :submitText="coreString('saveChangesAction')"
    :cancelText="coreString('cancelAction')"
    :submitDisabled="saving"
    @submit="handleSubmit"
    @cancel="$emit('cancel')"
  >
    <p v-if="!lessons.length">
      {{ $tr('noLessonsMessage') }}
    </p>
    <KGrid v-else>
      <KGridItem
        v-for="lesson in lessons"
        :key="lesson.id"
        :layout12="{ span: 12 }"
      >
        <KTextbox
          v-model="dueDates[lesson.id]"
          type="date"
          :label="lesson.title"
          :description="dueDateLabel$()"
        />
      </KGridItem>
    </KGrid>
  </KModal>

</template>


<script>

  import { ref, reactive } from 'vue';
  import LessonResource from 'kolibri-common/apiResources/LessonResource';
  import commonCoreStrings from 'kolibri/uiText/commonCoreStrings';
  import useSnackbar from 'kolibri/composables/useSnackbar';
  import useLearnerProgressSummary from '../../composables/useLearnerProgressSummary';
  import { coachStrings } from '../common/commonCoachStrings';

  // A local 'YYYY-MM-DD' copy of a lesson's due_date, matching the native
  // date-input format (mirrors the conversion in AssignmentDetailsModal.vue).
  function toDateInputValue(dueDate) {
    return dueDate ? dueDate.toISOString().slice(0, 10) : '';
  }

  export default {
    name: 'RescheduleWorkModal',
    mixins: [commonCoreStrings],
    setup(props) {
      const { createSnackbar } = useSnackbar();
      const { dueDateLabel$ } = coachStrings;
      const { getLearnerLessons } = useLearnerProgressSummary();

      const lessons = getLearnerLessons(props.learnerId);
      const dueDates = reactive({});
      lessons.forEach(lesson => {
        dueDates[lesson.id] = toDateInputValue(lesson.due_date);
      });

      return { lessons, dueDates, saving: ref(false), dueDateLabel$, createSnackbar };
    },
    props: {
      learnerId: {
        type: String,
        required: true,
      },
      learnerName: {
        type: String,
        required: true,
      },
    },
    methods: {
      handleSubmit() {
        const changedLessons = this.lessons.filter(
          lesson => this.dueDates[lesson.id] !== toDateInputValue(lesson.due_date),
        );
        if (!changedLessons.length) {
          this.$emit('success');
          return;
        }

        this.saving = true;
        return Promise.all(
          changedLessons.map(lesson =>
            LessonResource.saveModel({
              id: lesson.id,
              data: {
                // Due date means "due by the end of that day".
                due_date: this.dueDates[lesson.id] ? `${this.dueDates[lesson.id]}T23:59:59` : null,
              },
            }),
          ),
        )
          .then(() => {
            this.saving = false;
            this.$emit('success');
          })
          .catch(() => {
            this.saving = false;
            this.createSnackbar(this.$tr('submitErrorMessage'));
          });
      },
    },
    $trs: {
      modalTitle: {
        message: 'Reschedule work for {name}',
        context:
          "Title of the modal where a coach can change due dates for a single learner's assigned lessons.",
      },
      noLessonsMessage: {
        message: 'No lessons are assigned to this learner yet',
        context: 'Message shown in the reschedule modal when a learner has no assigned lessons.',
      },
      submitErrorMessage: {
        message: 'There was a problem saving your changes',
        context: 'Generic error message.',
      },
    },
  };

</script>
