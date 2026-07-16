<script setup>
import { onMounted, ref, watch, computed } from 'vue';
import { useStore, useMapGetter } from 'dashboard/composables/store';
import { useLiveRefresh } from 'dashboard/composables/useLiveRefresh';
import ChannelTable from './ChannelTable.vue';
import CampaignTable from './CampaignTable.vue';
import MetricCard from '../reports/components/overview/MetricCard.vue';
import getUnixTime from 'date-fns/getUnixTime';
import startOfMonth from 'date-fns/startOfMonth';
import endOfMonth from 'date-fns/endOfMonth';
import format from 'date-fns/format';
import addMonths from 'date-fns/addMonths';
import subMonths from 'date-fns/subMonths';
import Button from 'dashboard/components-next/button/Button.vue';

const store = useStore();

const channelMetrics = useMapGetter('getChannelMetrics');
const campaignMetrics = useMapGetter('getCampaignMetrics');
const isLoading = useMapGetter('getOverviewUIFlags');

const channelMonthOffset = ref(0);
const campaignMonthOffset = ref(0);

const getMonthRange = (offset) => {
  const now = new Date();
  const targetDate = offset === 0 ? now : (offset > 0 ? addMonths(now, offset) : subMonths(now, Math.abs(offset)));
  return {
    from: getUnixTime(startOfMonth(targetDate)),
    to: getUnixTime(endOfMonth(targetDate)),
    label: format(targetDate, 'MMMM yyyy')
  };
};

const channelDateData = computed(() => getMonthRange(channelMonthOffset.value));
const campaignDateData = computed(() => getMonthRange(campaignMonthOffset.value));

const previousChannelMonth = () => { channelMonthOffset.value -= 1; };
const nextChannelMonth = () => { channelMonthOffset.value += 1; };

const previousCampaignMonth = () => { campaignMonthOffset.value -= 1; };
const nextCampaignMonth = () => { campaignMonthOffset.value += 1; };

const fetchChannelMetricsForOffset = () => {
  const range = getMonthRange(channelMonthOffset.value);
  store.dispatch('fetchChannelMetrics', { from: range.from, to: range.to });
};

const fetchCampaignMetricsForOffset = () => {
  const range = getMonthRange(campaignMonthOffset.value);
  store.dispatch('fetchCampaignMetrics', { from: range.from, to: range.to });
};

const fetchIndependentMetrics = () => {
  fetchChannelMetricsForOffset();
  fetchCampaignMetricsForOffset();
};

const { startRefetching } = useLiveRefresh(fetchIndependentMetrics);

watch(() => channelMonthOffset.value, () => {
  fetchChannelMetricsForOffset();
});

watch(() => campaignMonthOffset.value, () => {
  fetchCampaignMetricsForOffset();
});

onMounted(() => {
  // Load metrics immediately on first visit
  fetchIndependentMetrics();
  // Start auto-refresh cycle
  startRefetching();
});

</script>

<template>
  <div class="column">
    <div class="mt-4 flex flex-col gap-4">
      <MetricCard title="Conversaciones por canales" class="w-full">
        <template #control>
          <div class="flex items-center gap-2">
             <Button sm slate faded icon="i-lucide-chevron-left" @click="previousChannelMonth" />
             <span class="text-sm font-medium text-slate-800 dark:text-slate-100 min-w-[120px] text-center capitalize">{{ channelDateData.label }}</span>
             <Button sm slate faded icon="i-lucide-chevron-right" @click="nextChannelMonth" :disabled="channelMonthOffset >= 0" />
          </div>
        </template>
        <ChannelTable
          :channel-metrics="channelMetrics"
          :is-loading="isLoading.isFetchingChannelMetrics"
        />
      </MetricCard>
      
      <MetricCard title="Rendimiento de Campañas" class="w-full">
        <template #control>
          <div class="flex items-center gap-2">
             <Button sm slate faded icon="i-lucide-chevron-left" @click="previousCampaignMonth" />
             <span class="text-sm font-medium text-slate-800 dark:text-slate-100 min-w-[120px] text-center capitalize">{{ campaignDateData.label }}</span>
             <Button sm slate faded icon="i-lucide-chevron-right" @click="nextCampaignMonth" :disabled="campaignMonthOffset >= 0" />
          </div>
        </template>
        <CampaignTable
          :campaign-metrics="campaignMetrics"
          :is-loading="isLoading.isFetchingCampaignMetrics"
        />
      </MetricCard>
    </div>
  </div>
</template>
