<script setup>
import { onMounted, ref, watch } from 'vue';
import { useStore, useMapGetter } from 'dashboard/composables/store';
import FirstContactsBaseHeatmapContainer from './FirstContactsBaseHeatmapContainer.vue';
import FirstContactsBarChartContainer from './FirstContactsBarChartContainer.vue';
import FirstContactsDateRangeSelector from './FirstContactsDateRangeSelector.vue';
import MetricCard from '../reports/components/overview/MetricCard.vue';
import { useI18n } from 'vue-i18n';
import getUnixTime from 'date-fns/getUnixTime';


const { t } = useI18n();
const store = useStore();

const summaryData = useMapGetter('getFirstContactsSummary');
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
    store.dispatch('fetchFirstContactsSummary', {
      from: getUnixTime(selectedFrom.value),
      to: getUnixTime(selectedTo.value)
    });
  }
};

watch([selectedFrom, selectedTo], () => {
  fetchSummary();
});

onMounted(() => {
  // fetchSummary will be triggered by the watch when default values are set by FirstContactsDateRangeSelector
});

</script>

<template>
  <div class="column">
    <woot-tabs :index="selectedTab" @change="selectedTab = $event">
      <woot-tabs-item name="Tendencias (Barras)" :index="0" />
      <woot-tabs-item name="Horarios Operativos (Heatmaps)" :index="1" />
    </woot-tabs>

    <!-- Contenido de Tendencias -->
    <div v-if="selectedTab === 0" class="mt-4">
      <FirstContactsBarChartContainer title="Tendencias Mensuales: Primeras Conversaciones" />
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
