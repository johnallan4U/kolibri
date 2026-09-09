<template>

  <div>
    <h2>
      <KLabeledIcon
        icon="topic"
        :label="$tr('header')"
      />
    </h2>

    <KCardGrid
      v-if="contentNodes && contentNodes.length > 0"
      layout="1-2-3"
      :layoutOverride="[{ columnGap: '16px', rowGap: '16px' }]"
    >
      <ResourceCard
        v-for="node in contentNodes"
        :key="node.id"
        :contentNode="node"
        :to="getContentLink(node)"
      >
        <template #footer>
          <span
            v-if="node.totalCount > 0"
            data-testid="completion"
          >
            {{
              $tr('completionFraction', { completed: node.completedCount, total: node.totalCount })
            }}
          </span>
        </template>
      </ResourceCard>
    </KCardGrid>

    <p v-else>
      {{ $tr('noAssignedContentMessage') }}
    </p>
  </div>

</template>


<script>

  import useContentLink from '../../composables/useContentLink';
  import ResourceCard from '../cards/ResourceCard.vue';

  export default {
    name: 'AssignedContentCards',
    components: {
      ResourceCard,
    },
    setup() {
      const { genContentLinkBackLinkCurrentPage } = useContentLink();

      function getContentLink(node) {
        return genContentLinkBackLinkCurrentPage(node.id, node.is_leaf);
      }

      return { getContentLink };
    },
    props: {
      contentNodes: {
        type: Array,
        required: true,
      },
    },
    $trs: {
      header: {
        message: 'Your assigned work',
        context:
          "Section header on the learner's Home page, listing the topics/resources a coach has directly assigned to them.",
      },
      completionFraction: {
        message: '{completed, number}/{total, number} complete',
        context: 'Shows how much of an assigned topic a learner has finished.',
      },
      noAssignedContentMessage: {
        message: 'You have no work assigned',
        context: 'Message that a learner sees if a coach has not assigned any content to them.',
      },
    },
  };

</script>


<style lang="scss" scoped></style>
