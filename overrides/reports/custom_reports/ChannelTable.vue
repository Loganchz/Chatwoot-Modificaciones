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
import ChannelCell from './ChannelCell.vue';

const props = defineProps({
  channelMetrics: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
});

const { uiSettings, updateUISettings } = useUISettings();

const CHANNEL_TABLE_PAGE_SIZE_KEY = 'report_overview_channel_table_page_size';

const getPageSize = () => {
  return uiSettings.value[CHANNEL_TABLE_PAGE_SIZE_KEY] || 5;
};

const handlePageSizeChange = pageSize => {
  updateUISettings({ [CHANNEL_TABLE_PAGE_SIZE_KEY]: pageSize });
};

const tableData = computed(() => {
  return [...props.channelMetrics].sort((a, b) => b.open_conversations - a.open_conversations);
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

const columnHelper = createColumnHelper();
const columns = [
  columnHelper.accessor('name', {
    header: 'Canal',
    cell: cellProps => h(ChannelCell, cellProps),
    size: 250,
  }),
  columnHelper.accessor('open_conversations', {
    header: 'Abiertas',
    cell: defaultSpanRender,
    size: 100,
  }),
  columnHelper.accessor('unattended_conversations', {
    header: 'Desatendidas',
    cell: defaultSpanRender,
    size: 100,
  }),
  columnHelper.accessor('resolved_conversations', {
    header: 'Resueltas',
    cell: defaultSpanRender,
    size: 100,
  }),
  columnHelper.accessor('new_conversations_today', {
    header: 'Nuevas Hoy',
    cell: defaultSpanRender,
    size: 100,
  }),
  columnHelper.accessor('resolution_rate', {
    header: 'Tasa de Cierre',
    cell: rateSpanRender,
    size: 100,
  }),
  columnHelper.accessor('total_messages', {
    header: 'Mensajes (total)',
    cell: defaultSpanRender,
    size: 120,
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
      <span class="ml-2">Cargando métricas de canales...</span>
    </div>
    <EmptyState
      v-else-if="!isLoading && !channelMetrics.length"
      title="No hay métricas de canales disponibles"
    />
  </div>
</template>
