<script setup>
import { onMounted, ref, watch, computed } from 'vue';
import { useStore, useMapGetter } from 'dashboard/composables/store';
import { useLiveRefresh } from 'dashboard/composables/useLiveRefresh';
import FirstContactsBaseHeatmapContainer from './FirstContactsBaseHeatmapContainer.vue';
import FirstContactsBarChartContainer from './FirstContactsBarChartContainer.vue';
import FirstContactsDateRangeSelector from './FirstContactsDateRangeSelector.vue';
import ChannelTable from './ChannelTable.vue';
import CampaignTable from './CampaignTable.vue';
import MetricCard from '../reports/components/overview/MetricCard.vue';
import { useI18n } from 'vue-i18n';
import getUnixTime from 'date-fns/getUnixTime';
import startOfMonth from 'date-fns/startOfMonth';
import endOfMonth from 'date-fns/endOfMonth';
import format from 'date-fns/format';
import addMonths from 'date-fns/addMonths';
import subMonths from 'date-fns/subMonths';
import Button from 'dashboard/components-next/button/Button.vue';
const { t } = useI18n();
const store = useStore();

const summaryData = useMapGetter('getFirstContactsSummary');
const channelMetrics = useMapGetter('getChannelMetrics');
const campaignMetrics = useMapGetter('getCampaignMetrics');
const isLoading = useMapGetter('getOverviewUIFlags');
const selectedFrom = ref(null);
const selectedTo = ref(null);
const selectedDaysBefore = ref(null);
const selectedTab = ref(0);

const isMonthFilter = ref(false);
const currentMonthOffset = ref(0);

const handleRangeTypeChange = type => {
  isMonthFilter.value = type === 'month';
};

const handleMonthOffsetChange = offset => {
  currentMonthOffset.value = offset;
};

const fetchSummary = () => {
  if (selectedFrom.value && selectedTo.value) {
    const fromVal = getUnixTime(selectedFrom.value);
    const toVal = getUnixTime(selectedTo.value);

    store.dispatch('fetchFirstContactsSummary', {
      from: fromVal,
      to: toVal
    });
  }
};

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

watch([selectedFrom, selectedTo], () => {
  fetchSummary();
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
    <woot-tabs :index="selectedTab" @change="selectedTab = $event">
      <woot-tabs-item name="Tendencias (Barras)" :index="0" />
      <woot-tabs-item name="Horarios Operativos (Heatmaps)" :index="1" />
    </woot-tabs>

    <!-- Contenido de Tendencias -->
    <div v-if="selectedTab === 0" class="mt-4 flex flex-col gap-4">
      <FirstContactsBarChartContainer title="Tendencias Mensuales: Primeras Conversaciones" />
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

    <!-- Contenido de Heatmaps -->
    <div v-if="selectedTab === 1" class="mt-4">
      <div class="flex flex-row gap-4 mb-4">
      <MetricCard title="Resumen de Contactos y Conversaciones Creadas" class="w-full">
        <template #control>
          <FirstContactsDateRangeSelector
            v-model:from="selectedFrom"
            v-model:to="selectedTo"
            v-model:days-num="selectedDaysBefore"
            @range-type-change="handleRangeTypeChange"
            @month-offset-change="handleMonthOffsetChange"
          />
        </template>

        
        <div class="flex flex-row gap-8 py-4 px-2">
          <div class="flex flex-col">
            <span class="text-n-slate-11 text-sm font-medium">Nuevos Contactos (Total)</span>
            <div class="flex items-center gap-2 mt-1">

              <span v-if="isLoading.isFetchingFirstContactsSummary" class="text-n-slate-10 text-xl animate-pulse">--</span>
              <span v-else class="text-n-slate-12 text-3xl font-bold">{{ summaryData.contacts_count }}</span>
            </div>
          </div>
          
          <div class="flex flex-col">
            <span class="text-n-slate-11 text-sm font-medium">Nuevas Conversaciones (Total)</span>
            <div class="flex items-center gap-2 mt-1">

              <span v-if="isLoading.isFetchingFirstContactsSummary" class="text-n-slate-10 text-xl animate-pulse">--</span>
              <span v-else class="text-n-slate-12 text-3xl font-bold">{{ summaryData.conversations_count }}</span>
            </div>
          </div>
        </div>
      </MetricCard>
    </div>

    <!-- Inbound Heatmap -->
    <FirstContactsBaseHeatmapContainer
      metric="first_contact_inbound"
      title="Primeras Conversaciones Entrantes (Iniciadas por el Cliente)"
      download-title="first_contact_inbound"

      store-getter="getFirstContactInboundHeatmapData"
      store-action="fetchFirstContactInboundHeatmap"
      ui-flag-key="isFetchingFirstContactInboundHeatmap"
      color-scheme="blue"
      class="mb-8"
    />

      <FirstContactsBaseHeatmapContainer
        metric="first_contact_outbound"
        title="Primeras Conversaciones Salientes (Iniciadas por la Empresa)"
        download-title="first_contact_outbound"
        store-getter="getFirstContactOutboundHeatmapData"
        store-action="fetchFirstContactOutboundHeatmap"
        ui-flag-key="isFetchingFirstContactOutboundHeatmap"
        color-scheme="green"
      />
    </div>
  </div>
</template>

