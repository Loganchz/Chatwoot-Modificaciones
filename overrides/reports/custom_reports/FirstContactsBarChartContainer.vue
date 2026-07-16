<script setup>
import { onMounted, ref, computed, watch } from 'vue';
import { useToggle } from '@vueuse/core';
import MetricCard from '../reports/components/overview/MetricCard.vue';
import BarChart from 'shared/components/charts/BarChart.vue';
import { useStore, useMapGetter } from 'dashboard/composables/store';
import { useLiveRefresh } from 'dashboard/composables/useLiveRefresh';
import fromUnixTime from 'date-fns/fromUnixTime';
import format from 'date-fns/format';
import getUnixTime from 'date-fns/getUnixTime';
import startOfMonth from 'date-fns/startOfMonth';
import endOfMonth from 'date-fns/endOfMonth';
import addMonths from 'date-fns/addMonths';
import subMonths from 'date-fns/subMonths';
import DropdownMenu from 'dashboard/components-next/dropdown-menu/DropdownMenu.vue';
import Button from 'dashboard/components-next/button/Button.vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  title: {
    type: String,
    required: true,
  }
});

const store = useStore();
const { t } = useI18n();

const uiFlags = useMapGetter('getOverviewUIFlags');
const inboundData = useMapGetter('getFirstContactInboundChartData');
const outboundData = useMapGetter('getFirstContactOutboundChartData');
const inboxes = useMapGetter('inboxes/getInboxes');

const selectedInbox = ref(null);
const currentMonthOffset = ref(0);

const isLoading = computed(() => uiFlags.value.isFetchingFirstContactInboundChart || uiFlags.value.isFetchingFirstContactOutboundChart);

const currentMonthDate = computed(() => {
  const now = new Date();
  if (currentMonthOffset.value === 0) {
    return now;
  }
  return currentMonthOffset.value > 0
    ? addMonths(now, currentMonthOffset.value)
    : subMonths(now, Math.abs(currentMonthOffset.value));
});

const selectedRange = computed(() => {
  const date = currentMonthDate.value;
  return {
    from: startOfMonth(date),
    to: endOfMonth(date),
  };
});

const currentMonthLabel = computed(() => {
  return format(currentMonthDate.value, 'MMMM yyyy');
});

const inboxMenuItems = computed(() => {
  return [
    {
      label: t('INBOX_REPORTS.ALL_INBOXES'),
      value: null,
      action: 'select_inbox',
    },
    ...inboxes.value.map(inbox => ({
      label: inbox.name,
      value: inbox.id,
      action: 'select_inbox',
    })),
  ];
});

const selectedInboxFilter = computed(() => {
  if (!selectedInbox.value) {
    return { label: t('INBOX_REPORTS.ALL_INBOXES') };
  }
  return inboxMenuItems.value.find(
    item => item.value === selectedInbox.value.id
  );
});

const [showInboxDropdown, toggleInboxDropdown] = useToggle();

const fetchChartData = () => {
  if (isLoading.value) {
    return;
  }

  const { from, to } = selectedRange.value;

  const params = {
    from: getUnixTime(from),
    to: getUnixTime(to),
    groupBy: 'day'
  };

  if (selectedInbox.value) {
    params.type = 'inbox';
    params.id = selectedInbox.value.id;
  }

  store.dispatch('fetchFirstContactInboundChart', params);
  store.dispatch('fetchFirstContactOutboundChart', params);
};

const handleInboxAction = ({ value }) => {
  toggleInboxDropdown(false);
  selectedInbox.value = value
    ? inboxes.value.find(inbox => inbox.id === value)
    : null;
};

const { startRefetching } = useLiveRefresh(fetchChartData);

watch(
  () => currentMonthOffset.value,
  () => {
    fetchChartData();
  }
);

watch(
  () => selectedInbox.value,
  () => {
    fetchChartData();
  }
);

onMounted(() => {
  store.dispatch('inboxes/get');
  fetchChartData();
  startRefetching();
});

// Chart Collection Logic
const chartCollection = computed(() => {
  if (!inboundData.value || !outboundData.value || (inboundData.value.length === 0 && outboundData.value.length === 0)) {
    return {
      labels: [],
      datasets: [
        { label: 'Entrantes', data: [], backgroundColor: '#1f93ff' },
        { label: 'Salientes', data: [], backgroundColor: '#00c388' }
      ]
    };
  }
  
  // Extract all unique timestamps and format them as 'dd-MMM'
  const timestamps = Array.from(new Set([
    ...inboundData.value.map(d => d.timestamp),
    ...outboundData.value.map(d => d.timestamp)
  ])).sort((a, b) => a - b);
  
  const labels = timestamps.map(ts => format(fromUnixTime(ts), 'dd-MMM'));
  
  // Map data to the timeline
  const inData = timestamps.map(ts => {
    const found = inboundData.value.find(d => d.timestamp === ts);
    return found ? found.value : 0;
  });
  
  const outData = timestamps.map(ts => {
    const found = outboundData.value.find(d => d.timestamp === ts);
    return found ? found.value : 0;
  });
  
  return {
    labels,
    datasets: [
      {
        label: 'Entrantes',
        data: inData,
        backgroundColor: '#1f93ff', // Chatwoot Blue
        borderWidth: 0,
      },
      {
        label: 'Salientes',
        data: outData,
        backgroundColor: '#00c388', // Chatwoot Green
        borderWidth: 0,
      }
    ]
  };
});

const previousMonth = () => { currentMonthOffset.value -= 1; };
const nextMonth = () => { currentMonthOffset.value += 1; };

</script>

<template>
  <div class="flex flex-row flex-wrap max-w-full">
    <MetricCard :header="title" :is-loading="isLoading">
      <template #control>
        <div class="flex items-center gap-2">
           <Button sm slate faded icon="i-lucide-chevron-left" @click="previousMonth" />
           <span class="text-sm font-medium text-slate-800 dark:text-slate-100 min-w-[120px] text-center capitalize">{{ currentMonthLabel }}</span>
           <Button sm slate faded icon="i-lucide-chevron-right" @click="nextMonth" :disabled="currentMonthOffset >= 0" />
        </div>
        <div
          v-on-clickaway="() => toggleInboxDropdown(false)"
          class="relative flex items-center group"
        >
          <Button
            sm
            slate
            faded
            :label="selectedInboxFilter.label"
            class="rounded-md group-hover:bg-n-alpha-2 max-w-[200px]"
            @click="toggleInboxDropdown()"
          />
          <DropdownMenu
            v-if="showInboxDropdown"
            :menu-items="inboxMenuItems"
            show-search
            :search-placeholder="t('INBOX_REPORTS.SEARCH_INBOX')"
            class="mt-1 ltr:right-0 rtl:left-0 xl:ltr:right-0 xl:rtl:left-0 top-full !min-w-56 max-w-56 max-h-96"
            @action="handleInboxAction($event)"
          />
        </div>
      </template>
      
      <div class="w-full h-80 mt-4 p-4">
         <BarChart v-if="!isLoading" :key="chartCollection.labels ? chartCollection.labels.length : 0" :collection="chartCollection" />
      </div>
    </MetricCard>
  </div>
</template>
