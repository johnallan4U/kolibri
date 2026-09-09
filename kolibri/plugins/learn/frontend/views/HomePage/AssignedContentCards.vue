<template>

  <div>
    <h2>
      <KLabeledIcon
        icon="topic"
        :label="$tr('header')"
      />
    </h2>

    <template v-if="subjectGroups.length > 0">
      <div
        v-for="group in subjectGroups"
        :key="group.channelId"
        class="subject-group"
      >
        <h3>{{ group.title }}</h3>
        <KCardGrid
          layout="1-2-3"
          :layoutOverride="[{ columnGap: '16px', rowGap: '16px' }]"
        >
          <ResourceCard
            v-for="node in group.nodes"
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
                  $tr('completionFraction', {
                    completed: node.completedCount,
                    total: node.totalCount,
                  })
                }}
              </span>
            </template>
          </ResourceCard>
        </KCardGrid>
      </div>
    </template>
    <p v-else-if="contentNodes.length === 0">
      {{ $tr('noAssignedContentMessage') }}
    </p>
    <p v-else>
      {{ $tr('allCompleteMessage') }}
    </p>

    <AccordionContainer
      v-if="completedContentNodes.length > 0"
      class="completed-accordion"
    >
      <AccordionItem
        :title="$tr('completedResourcesCount', { count: completedContentNodes.length })"
      >
        <template #content>
          <KCardGrid
            layout="1-2-3"
            :layoutOverride="[{ columnGap: '16px', rowGap: '16px' }]"
          >
            <ResourceCard
              v-for="node in completedContentNodes"
              :key="node.id"
              :contentNode="node"
              :to="getContentLink(node)"
            >
              <template #footer>
                <span data-testid="completion">
                  {{
                    $tr('completionFraction', {
                      completed: node.completedCount,
                      total: node.totalCount,
                    })
                  }}
                </span>
              </template>
            </ResourceCard>
          </KCardGrid>
        </template>
      </AccordionItem>
    </AccordionContainer>
  </div>

</template>


<script>

  import { computed } from 'vue';
  import AccordionContainer from 'kolibri-common/components/accordion/AccordionContainer';
  import AccordionItem from 'kolibri-common/components/accordion/AccordionItem';
  import useChannels from 'kolibri-common/composables/useChannels';
  import useContentLink from '../../composables/useContentLink';
  import {
    isComplete,
    groupIncompleteBySubject,
  } from '../../composables/useAssignedContentGrouping';
  import ResourceCard from '../cards/ResourceCard.vue';

  export default {
    name: 'AssignedContentCards',
    components: {
      ResourceCard,
      AccordionContainer,
      AccordionItem,
    },
    setup(props) {
      const { genContentLinkBackLinkCurrentPage } = useContentLink();
      const { getChannelTitle } = useChannels();

      function getContentLink(node) {
        return genContentLinkBackLinkCurrentPage(node.id, node.is_leaf);
      }

      const completedContentNodes = computed(() => props.contentNodes.filter(isComplete));
      const subjectGroups = computed(() =>
        groupIncompleteBySubject(props.contentNodes, getChannelTitle),
      );

      return { getContentLink, completedContentNodes, subjectGroups };
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
      completedResourcesCount: {
        message: '{count, number} {count, plural, one {item completed} other {items completed}}',
        context:
          "Label for the collapsed section header that groups a learner's already-finished assigned work, out of the way of what's still to do.",
      },
      noAssignedContentMessage: {
        message: 'You have no work assigned',
        context: 'Message that a learner sees if a coach has not assigned any content to them.',
      },
      allCompleteMessage: {
        message: "You've finished everything that's been assigned",
        context: 'Message that a learner sees when they have completed all of their assigned work.',
      },
    },
  };

</script>


<style lang="scss" scoped>

  .subject-group:not(:first-child) {
    margin-top: 24px;
  }

  .completed-accordion {
    margin-top: 24px;
  }

</style>
