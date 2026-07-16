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
  const { channel_type: channelType, medium } = props.row.original;
  return getInboxIconByType(channelType, medium);
});

const getReadableChannel = type => {
  if (!type) return '';
  return type
    .replace('Channel::', '')
    .replace('Page', '')
    .replace('Widget', '')
    .replace('Profile', '')
    .replace('Sms', '');
};
</script>

<template>
  <BaseCell>
    <div class="items-center flex text-left">
      <div class="items-start flex flex-col min-w-0 my-0">
        <h6 class="overflow-hidden text-sm m-0 leading-[1.2] text-n-slate-12 whitespace-nowrap text-ellipsis">
          {{ row.original.name }}
        </h6>
        <span class="text-xs text-n-slate-11 capitalize">
          {{ getReadableChannel(row.original.channel_type) }}
        </span>
      </div>
    </div>
  </BaseCell>
</template>
