<template>

  <div class="node-row">
    <KButton
      v-if="node.isChannel"
      :text="node.title"
      appearance="basic-link"
      class="title-link"
      @click="$emit('open', node)"
    />
    <template v-else>
      <KCheckbox
        :checked="isChecked"
        :disabled="assignedViaAncestor"
        :label="node.title"
        @change="$emit('toggle', node)"
      />
      <KButton
        v-if="node.kind === 'topic'"
        :text="$tr('browseAction')"
        appearance="basic-link"
        @click="$emit('open', node)"
      />
      <span
        v-if="node.totalCount > 0"
        class="completion"
        data-testid="completion"
      >
        {{ $tr('completionFraction', { completed: node.completedCount, total: node.totalCount }) }}
      </span>
    </template>
  </div>

</template>


<script>

  export default {
    name: 'AssignContentNodeRow',
    props: {
      node: {
        type: Object,
        required: true,
      },
      // True when an ancestor topic is already directly assigned - the
      // checkbox shows checked but the coach must uncheck the ancestor
      // instead of this node individually (see plan Context section).
      assignedViaAncestor: {
        type: Boolean,
        default: false,
      },
    },
    computed: {
      isChecked() {
        return this.node.assigned || this.assignedViaAncestor;
      },
    },
    $trs: {
      browseAction: {
        message: 'Browse',
        context: 'Button to drill into a topic to see its contents.',
      },
      completionFraction: {
        message: '{completed, number}/{total, number} complete',
        context: "Shows how many of a topic's resources a learner has finished.",
      },
    },
  };

</script>


<style lang="scss" scoped>

  .node-row {
    display: flex;
    align-items: center;
    padding: 8px 0;
  }

  .title-link {
    text-align: left;
  }

  .completion {
    margin-left: auto;
    font-size: 13px;
  }

</style>
