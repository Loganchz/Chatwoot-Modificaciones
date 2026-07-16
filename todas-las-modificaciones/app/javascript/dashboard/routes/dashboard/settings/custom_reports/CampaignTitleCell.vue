<script setup>
import BaseCell from 'dashboard/components/table/BaseCell.vue';
import { getInboxIconByType } from 'dashboard/helper/inbox';
import { computed } from 'vue';

const props = defineProps({
  row: {
    type: Object,
    required: true,
  },
});

const inboxIcon = computed(() => {
  const { inbox_channel_type: channelType } = props.row.original;
  return getInboxIconByType(channelType);
});

const title = computed(() => props.row.original.title);
</script>

<template>
  <BaseCell>
    <div class="flex items-center gap-2">
      <Icon :icon="inboxIcon" size="20" class="text-n-slate-11" />
      <div class="flex flex-col">
        <span class="text-n-slate-12 font-medium truncate max-w-[200px]" :title="title">
          {{ title }}
        </span>
        <span class="text-n-slate-10 text-xs truncate max-w-[200px]" :title="row.original.inbox_name">
          {{ row.original.inbox_name }}
        </span>
      </div>
    </div>
  </BaseCell>
</template>
