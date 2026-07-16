<script setup>
import { computed, h } from 'vue';
import {
  useVueTable,
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
} from '@tanstack/vue-table';
import { useUISettings } from 'dashboard/composables/useUISettings';

import Spinner from 'shared/components/Spinner.vue';
import EmptyState from 'dashboard/components/widgets/EmptyState.vue';
import Table from 'dashboard/components/table/Table.vue';
import Pagination from 'dashboard/components/table/Pagination.vue';
import WootLabel from 'dashboard/components/ui/Label.vue';
import CampaignTitleCell from './CampaignTitleCell.vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  campaignMetrics: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
});

const { t } = useI18n();
const { uiSettings, updateUISettings } = useUISettings();

const CAMPAIGN_TABLE_PAGE_SIZE_KEY = 'report_overview_campaign_table_page_size';

const getPageSize = () => {
  return uiSettings.value[CAMPAIGN_TABLE_PAGE_SIZE_KEY] || 5;
};

const handlePageSizeChange = pageSize => {
  updateUISettings({ [CAMPAIGN_TABLE_PAGE_SIZE_KEY]: pageSize });
};

const tableData = computed(() => {
  return [...props.campaignMetrics].sort((a, b) => b.total_conversations - a.total_conversations);
});

const defaultSpanRender = cellProps =>
  h(
    'span',
    {
      class: cellProps.getValue() ? 'text-n-slate-12' : 'text-n-slate-11',
    },
    cellProps.getValue() !== undefined && cellProps.getValue() !== null ? cellProps.getValue() : '0'
  );

const rateSpanRender = cellProps =>
  h(
    'span',
    {
      class: 'text-n-slate-12',
    },
    `${cellProps.getValue()}%`
  );

const statusBadgeRender = cellProps => {
  const status = cellProps.getValue();
  let colorScheme = 'info';
  let label = status;

  if (status === 'completed') {
    colorScheme = 'success';
    label = 'Completada';
  } else if (status === 'active') {
    colorScheme = 'success';
    label = 'Activa';
  } else if (status === 'processing') {
    colorScheme = 'warning';
    label = 'Procesando';
  }

  return h(WootLabel, {
    title: label,
    colorScheme,
  });
};

const channelSpanRender = cellProps => {
  const type = cellProps.getValue();
  let label = 'Desconocido';
  if (type) {
    if (type.includes('WebWidget')) label = 'Live Chat';
    else if (type.includes('Whatsapp')) label = 'WhatsApp';
    else if (type.includes('TwilioSms') || type.includes('Sms')) label = 'SMS';
    else label = type.replace('Channel::', '');
  }
  return h('span', { class: 'text-n-slate-12' }, label);
};

const columnHelper = createColumnHelper();
const columns = [
  columnHelper.accessor('title', {
    header: 'Campaña / Plantilla',
    cell: cellProps => h(CampaignTitleCell, cellProps),
    size: 250,
  }),

  columnHelper.accessor('total_conversations', {
    header: 'Enviadas',
    cell: defaultSpanRender,
    size: 100,
  }),
  columnHelper.accessor('no_response_conversations', {
    header: 'Sin Respuesta',
    cell: defaultSpanRender,
    size: 100,
  }),
  columnHelper.accessor('replied_conversations', {
    header: 'Respondidas',
    cell: defaultSpanRender,
    size: 100,
  }),
  columnHelper.accessor('reply_rate', {
    header: 'Tasa Respuesta',
    cell: rateSpanRender,
    size: 100,
  }),
  columnHelper.accessor('resolved_conversations', {
    header: 'Resueltas',
    cell: defaultSpanRender,
    size: 100,
  }),
  columnHelper.accessor('unattended_conversations', {
    header: 'Desatendidas',
    cell: defaultSpanRender,
    size: 100,
  }),
];

const table = useVueTable({
  get data() {
    return tableData.value;
  },
  columns,
  enableSorting: false,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  initialState: {
    pagination: {
      pageSize: getPageSize(),
    },
  },
});
</script>

<template>
  <div class="flex flex-col flex-1">
    <Table :table="table" class="max-h-[calc(100vh-21.875rem)]" />
    <Pagination
      class="mt-2"
      :table="table"
      show-page-size-selector
      :default-page-size="getPageSize()"
      @page-size-change="handlePageSizeChange"
    />
    <div
      v-if="isLoading"
      class="items-center flex text-base justify-center p-8"
    >
      <Spinner />
      <span class="ml-2">Cargando rendimiento de campañas...</span>
    </div>
    <EmptyState
      v-else-if="!isLoading && !campaignMetrics.length"
      title="No hay campañas registradas o activas"
    />
  </div>
</template>
