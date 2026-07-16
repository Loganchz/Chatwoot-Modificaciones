/* eslint no-console: 0 */
import * as types from '../mutation-types';
import { STATUS } from '../constants';
import Report from '../../api/reports';
import { downloadCsvFile, generateFileName } from '../../helper/downloadHelper';
import AnalyticsHelper from '../../helper/AnalyticsHelper';
import { REPORTS_EVENTS } from '../../helper/AnalyticsHelper/events';
import { clampDataBetweenTimeline } from 'shared/helpers/ReportsDataHelper';
import liveReports from '../../api/liveReports';

const state = {
  fetchingStatus: false,
  accountSummaryFetchingStatus: STATUS.FINISHED,
  botSummaryFetchingStatus: STATUS.FINISHED,
  accountReport: {
    isFetching: {
      conversations_count: false,
      incoming_messages_count: false,
      outgoing_messages_count: false,
      avg_first_response_time: false,
      avg_resolution_time: false,
      resolutions_count: false,
      bot_resolutions_count: false,
      bot_handoffs_count: false,
      reply_time: false,
    },
    data: {
      conversations_count: [],
      incoming_messages_count: [],
      outgoing_messages_count: [],
      avg_first_response_time: [],
      avg_resolution_time: [],
      resolutions_count: [],
      bot_resolutions_count: [],
      bot_handoffs_count: [],
      reply_time: [],
    },
  },
  accountSummary: {
    avg_first_response_time: 0,
    avg_resolution_time: 0,
    conversations_count: 0,
    incoming_messages_count: 0,
    outgoing_messages_count: 0,
    reply_time: 0,
    resolutions_count: 0,
    bot_resolutions_count: 0,
    bot_handoffs_count: 0,
    previous: {},
  },
  botSummary: {
    bot_resolutions_count: 0,
    bot_handoffs_count: 0,
    previous: {},
  },
  overview: {
    uiFlags: {
      isFetchingAccountConversationMetric: false,
      isFetchingAccountConversationsHeatmap: false,
      isFetchingAccountResolutionsHeatmap: false,
      isFetchingFirstContactInboundHeatmap: false,
      isFetchingFirstContactOutboundHeatmap: false,
      isFetchingFirstContactInboundChart: false,
      isFetchingFirstContactOutboundChart: false,
      isFetchingFirstContactsSummary: false,
      isFetchingAgentConversationMetric: false,


      isFetchingTeamConversationMetric: false,
      isFetchingChannelMetrics: false,
      isFetchingCampaignMetrics: false,
    },
    accountConversationMetric: {},
    accountConversationHeatmap: [],
    accountResolutionHeatmap: [],
    agentConversationMetric: [],
    teamConversationMetric: [],
    firstContactInboundHeatmap: [],
    firstContactOutboundHeatmap: [],
    firstContactInboundChart: [],
    firstContactOutboundChart: [],
    firstContactsSummary: {
      contacts_count: 0,
      conversations_count: 0
    },
    channelMetrics: [],
    campaignMetrics: [],
  },
};



const getters = {
  getAccountReports(_state) {
    return _state.accountReport;
  },
  getAccountSummary(_state) {
    return _state.accountSummary;
  },
  getBotSummary(_state) {
    return _state.botSummary;
  },
  getAccountSummaryFetchingStatus(_state) {
    return _state.accountSummaryFetchingStatus;
  },
  getBotSummaryFetchingStatus(_state) {
    return _state.botSummaryFetchingStatus;
  },
  getAccountConversationMetric(_state) {
    return _state.overview.accountConversationMetric;
  },
  getAccountConversationHeatmapData(_state) {
    return _state.overview.accountConversationHeatmap;
  },
  getAccountResolutionHeatmapData(_state) {
    return _state.overview.accountResolutionHeatmap;
  },
  getFirstContactInboundHeatmapData(_state) {
    return _state.overview.firstContactInboundHeatmap;
  },
  getFirstContactOutboundHeatmapData(_state) {
    return _state.overview.firstContactOutboundHeatmap;
  },
  getFirstContactInboundChartData(_state) {
    return _state.overview.firstContactInboundChart;
  },
  getFirstContactOutboundChartData(_state) {
    return _state.overview.firstContactOutboundChart;
  },
  getFirstContactsSummary(_state) {
    return _state.overview.firstContactsSummary;
  },
  getAgentConversationMetric(_state) {


    return _state.overview.agentConversationMetric;
  },
  getTeamConversationMetric(_state) {
    return _state.overview.teamConversationMetric;
  },
  getOverviewUIFlags($state) {
    return $state.overview.uiFlags;
  },
  getChannelMetrics(_state) {
    return _state.overview.channelMetrics;
  },
  getCampaignMetrics(_state) {
    return _state.overview.campaignMetrics;
  },
};

export const actions = {
  fetchAccountReport({ commit }, reportObj) {
    const { metric } = reportObj;
    commit(types.default.TOGGLE_ACCOUNT_REPORT_LOADING, {
      metric,
      value: true,
    });
    Report.getReports(reportObj).then(accountReport => {
      let { data } = accountReport;
      data = clampDataBetweenTimeline(data, reportObj.from, reportObj.to);
      commit(types.default.SET_ACCOUNT_REPORTS, {
        metric,
        data,
      });
      commit(types.default.TOGGLE_ACCOUNT_REPORT_LOADING, {
        metric,
        value: false,
      });
    });
  },
  fetchAccountConversationHeatmap({ commit }, reportObj) {
    commit(types.default.TOGGLE_HEATMAP_LOADING, true);
    Report.getReports({ ...reportObj, groupBy: 'hour' }).then(heatmapData => {
      let { data } = heatmapData;
      data = clampDataBetweenTimeline(data, reportObj.from, reportObj.to);

      commit(types.default.SET_HEATMAP_DATA, data);
      commit(types.default.TOGGLE_HEATMAP_LOADING, false);
    });
  },
  fetchAccountResolutionHeatmap({ commit }, reportObj) {
    commit(types.default.TOGGLE_RESOLUTION_HEATMAP_LOADING, true);
    Report.getReports({ ...reportObj, groupBy: 'hour' }).then(heatmapData => {
      let { data } = heatmapData;
      data = clampDataBetweenTimeline(data, reportObj.from, reportObj.to);

      commit(types.default.SET_RESOLUTION_HEATMAP_DATA, data);
      commit(types.default.TOGGLE_RESOLUTION_HEATMAP_LOADING, false);
    });
  },
  fetchFirstContactInboundHeatmap({ commit }, reportObj) {
    commit('TOGGLE_INBOUND_HEATMAP_LOADING', true);
    Report.getFirstContactHeatmaps({ ...reportObj, direction: 'inbound', inboxIds: reportObj.id }).then(heatmapData => {
      let { data } = heatmapData;
      data = clampDataBetweenTimeline(data, reportObj.from, reportObj.to);
      commit('SET_INBOUND_HEATMAP_DATA', data);
      commit('TOGGLE_INBOUND_HEATMAP_LOADING', false);
    });
  },
  fetchFirstContactOutboundHeatmap({ commit }, reportObj) {
    commit('TOGGLE_OUTBOUND_HEATMAP_LOADING', true);
    Report.getFirstContactHeatmaps({ ...reportObj, direction: 'outbound', inboxIds: reportObj.id }).then(heatmapData => {
      let { data } = heatmapData;
      data = clampDataBetweenTimeline(data, reportObj.from, reportObj.to);
      commit('SET_OUTBOUND_HEATMAP_DATA', data);
      commit('TOGGLE_OUTBOUND_HEATMAP_LOADING', false);
    });
  },
  fetchFirstContactInboundChart({ commit }, reportObj) {
    commit('TOGGLE_INBOUND_CHART_LOADING', true);
    Report.getFirstContactHeatmaps({ ...reportObj, direction: 'inbound', inboxIds: reportObj.id, groupBy: 'day' }).then(heatmapData => {
      let { data } = heatmapData;
      data = clampDataBetweenTimeline(data, reportObj.from, reportObj.to);
      commit('SET_INBOUND_CHART_DATA', data);
      commit('TOGGLE_INBOUND_CHART_LOADING', false);
    });
  },
  fetchFirstContactOutboundChart({ commit }, reportObj) {
    commit('TOGGLE_OUTBOUND_CHART_LOADING', true);
    Report.getFirstContactHeatmaps({ ...reportObj, direction: 'outbound', inboxIds: reportObj.id, groupBy: 'day' }).then(heatmapData => {
      let { data } = heatmapData;
      data = clampDataBetweenTimeline(data, reportObj.from, reportObj.to);
      commit('SET_OUTBOUND_CHART_DATA', data);
      commit('TOGGLE_OUTBOUND_CHART_LOADING', false);
    });
  },
  fetchFirstContactsSummary({ commit }, reportObj) {
    commit('TOGGLE_FIRST_CONTACTS_SUMMARY_LOADING', true);
    Report.getFirstContactsSummary({ ...reportObj, inboxIds: reportObj.id }).then(res => {
      commit('SET_FIRST_CONTACTS_SUMMARY', res.data);
      commit('TOGGLE_FIRST_CONTACTS_SUMMARY_LOADING', false);
    });
  },
  fetchChannelMetrics({ commit }, reportObj) {
    commit('SET_CHANNEL_METRICS_UI_FLAG', true);
    Report.getChannelMetrics(reportObj)
      .then(response => {
        commit('SET_CHANNEL_METRICS', response.data);
        commit('SET_CHANNEL_METRICS_UI_FLAG', false);
      })
      .catch(() => {
        commit('SET_CHANNEL_METRICS_UI_FLAG', false);
      });
  },
  fetchCampaignMetrics({ commit }, reportObj) {
    commit('SET_CAMPAIGN_METRICS_UI_FLAG', true);
    Report.getCampaignMetrics(reportObj)
      .then(response => {
        commit('SET_CAMPAIGN_METRICS', response.data);
        commit('SET_CAMPAIGN_METRICS_UI_FLAG', false);
      })
      .catch(() => {
        commit('SET_CAMPAIGN_METRICS_UI_FLAG', false);
      });
  },
  fetchAccountSummary({ commit }, reportObj) {

    commit(types.default.SET_ACCOUNT_SUMMARY_STATUS, STATUS.FETCHING);
    Report.getSummary(
      reportObj.from,
      reportObj.to,
      reportObj.type,
      reportObj.id,
      reportObj.groupBy,
      reportObj.businessHours
    )
      .then(accountSummary => {
        commit(types.default.SET_ACCOUNT_SUMMARY, accountSummary.data);
        commit(types.default.SET_ACCOUNT_SUMMARY_STATUS, STATUS.FINISHED);
      })
      .catch(() => {
        commit(types.default.SET_ACCOUNT_SUMMARY_STATUS, STATUS.FAILED);
      });
  },
  fetchBotSummary({ commit }, reportObj) {
    commit(types.default.SET_BOT_SUMMARY_STATUS, STATUS.FETCHING);
    Report.getBotSummary({
      from: reportObj.from,
      to: reportObj.to,
      groupBy: reportObj.groupBy,
      businessHours: reportObj.businessHours,
    })
      .then(botSummary => {
        commit(types.default.SET_BOT_SUMMARY, botSummary.data);
        commit(types.default.SET_BOT_SUMMARY_STATUS, STATUS.FINISHED);
      })
      .catch(() => {
        commit(types.default.SET_BOT_SUMMARY_STATUS, STATUS.FAILED);
      });
  },
  fetchAccountConversationMetric({ commit }, params = {}) {
    commit(types.default.TOGGLE_ACCOUNT_CONVERSATION_METRIC_LOADING, true);
    liveReports
      .getConversationMetric(params)
      .then(accountConversationMetric => {
        commit(
          types.default.SET_ACCOUNT_CONVERSATION_METRIC,
          accountConversationMetric.data
        );
        commit(types.default.TOGGLE_ACCOUNT_CONVERSATION_METRIC_LOADING, false);
      })
      .catch(() => {
        commit(types.default.TOGGLE_ACCOUNT_CONVERSATION_METRIC_LOADING, false);
      });
  },
  fetchAgentConversationMetric({ commit }) {
    commit(types.default.TOGGLE_AGENT_CONVERSATION_METRIC_LOADING, true);
    liveReports
      .getGroupedConversations({ groupBy: 'assignee_id' })
      .then(agentConversationMetric => {
        commit(
          types.default.SET_AGENT_CONVERSATION_METRIC,
          agentConversationMetric.data
        );
        commit(types.default.TOGGLE_AGENT_CONVERSATION_METRIC_LOADING, false);
      })
      .catch(() => {
        commit(types.default.TOGGLE_AGENT_CONVERSATION_METRIC_LOADING, false);
      });
  },
  fetchTeamConversationMetric({ commit }) {
    commit(types.default.TOGGLE_TEAM_CONVERSATION_METRIC_LOADING, true);
    liveReports
      .getGroupedConversations({ groupBy: 'team_id' })
      .then(teamMetric => {
        commit(types.default.SET_TEAM_CONVERSATION_METRIC, teamMetric.data);
        commit(types.default.TOGGLE_TEAM_CONVERSATION_METRIC_LOADING, false);
      })
      .catch(() => {
        commit(types.default.TOGGLE_TEAM_CONVERSATION_METRIC_LOADING, false);
      });
  },
  downloadAgentReports(_, reportObj) {
    return Report.getAgentReports(reportObj)
      .then(response => {
        downloadCsvFile(reportObj.fileName, response.data);
        AnalyticsHelper.track(REPORTS_EVENTS.DOWNLOAD_REPORT, {
          reportType: 'agent',
          businessHours: reportObj?.businessHours,
        });
      })
      .catch(error => {
        console.error(error);
      });
  },
  downloadConversationsSummaryReports(_, reportObj) {
    return Report.getConversationsSummaryReports(reportObj)
      .then(response => {
        downloadCsvFile(reportObj.fileName, response.data);
        AnalyticsHelper.track(REPORTS_EVENTS.DOWNLOAD_REPORT, {
          reportType: 'conversations_summary',
          businessHours: reportObj?.businessHours,
        });
      })
      .catch(error => {
        console.error(error);
      });
  },
  downloadLabelReports(_, reportObj) {
    return Report.getLabelReports(reportObj)
      .then(response => {
        downloadCsvFile(reportObj.fileName, response.data);
        AnalyticsHelper.track(REPORTS_EVENTS.DOWNLOAD_REPORT, {
          reportType: 'label',
          businessHours: reportObj?.businessHours,
        });
      })
      .catch(error => {
        console.error(error);
      });
  },
  downloadInboxReports(_, reportObj) {
    return Report.getInboxReports(reportObj)
      .then(response => {
        downloadCsvFile(reportObj.fileName, response.data);
        AnalyticsHelper.track(REPORTS_EVENTS.DOWNLOAD_REPORT, {
          reportType: 'inbox',
          businessHours: reportObj?.businessHours,
        });
      })
      .catch(error => {
        console.error(error);
      });
  },
  downloadTeamReports(_, reportObj) {
    return Report.getTeamReports(reportObj)
      .then(response => {
        downloadCsvFile(reportObj.fileName, response.data);
        AnalyticsHelper.track(REPORTS_EVENTS.DOWNLOAD_REPORT, {
          reportType: 'team',
          businessHours: reportObj?.businessHours,
        });
      })
      .catch(error => {
        console.error(error);
      });
  },
  downloadAccountConversationHeatmap(_, reportObj) {
    Report.getConversationTrafficCSV({ daysBefore: reportObj.daysBefore })
      .then(response => {
        downloadCsvFile(
          generateFileName({
            type: 'Conversation traffic',
            to: reportObj.to,
          }),
          response.data
        );

        AnalyticsHelper.track(REPORTS_EVENTS.DOWNLOAD_REPORT, {
          reportType: 'conversation_heatmap',
          businessHours: false,
        });
      })
      .catch(error => {
        console.error(error);
      });
  },
};

const mutations = {
  [types.default.SET_ACCOUNT_REPORTS](_state, { metric, data }) {
    _state.accountReport.data[metric] = data;
  },
  [types.default.SET_HEATMAP_DATA](_state, heatmapData) {
    _state.overview.accountConversationHeatmap = heatmapData;
  },
  [types.default.SET_RESOLUTION_HEATMAP_DATA](_state, heatmapData) {
    _state.overview.accountResolutionHeatmap = heatmapData;
  },
  SET_INBOUND_HEATMAP_DATA(_state, heatmapData) {
    _state.overview.firstContactInboundHeatmap = heatmapData;
  },
  SET_OUTBOUND_HEATMAP_DATA(_state, heatmapData) {
    _state.overview.firstContactOutboundHeatmap = heatmapData;
  },
  SET_INBOUND_CHART_DATA(_state, chartData) {
    _state.overview.firstContactInboundChart = chartData;
  },
  SET_OUTBOUND_CHART_DATA(_state, chartData) {
    _state.overview.firstContactOutboundChart = chartData;
  },
  SET_FIRST_CONTACTS_SUMMARY(_state, summary) {
    _state.overview.firstContactsSummary = summary;
  },
  [types.default.TOGGLE_ACCOUNT_REPORT_LOADING](_state, { metric, value }) {


    _state.accountReport.isFetching[metric] = value;
  },
  [types.default.SET_BOT_SUMMARY_STATUS](_state, status) {
    _state.botSummaryFetchingStatus = status;
  },
  [types.default.SET_ACCOUNT_SUMMARY_STATUS](_state, status) {
    _state.accountSummaryFetchingStatus = status;
  },
  [types.default.TOGGLE_HEATMAP_LOADING](_state, flag) {
    _state.overview.uiFlags.isFetchingAccountConversationsHeatmap = flag;
  },
  [types.default.TOGGLE_RESOLUTION_HEATMAP_LOADING](_state, flag) {
    _state.overview.uiFlags.isFetchingAccountResolutionsHeatmap = flag;
  },
  TOGGLE_INBOUND_HEATMAP_LOADING(_state, flag) {
    _state.overview.uiFlags.isFetchingFirstContactInboundHeatmap = flag;
  },
  TOGGLE_OUTBOUND_HEATMAP_LOADING(_state, flag) {
    _state.overview.uiFlags.isFetchingFirstContactOutboundHeatmap = flag;
  },
  TOGGLE_INBOUND_CHART_LOADING(_state, flag) {
    _state.overview.uiFlags.isFetchingFirstContactInboundChart = flag;
  },
  TOGGLE_OUTBOUND_CHART_LOADING(_state, flag) {
    _state.overview.uiFlags.isFetchingFirstContactOutboundChart = flag;
  },
  TOGGLE_FIRST_CONTACTS_SUMMARY_LOADING(_state, flag) {
    _state.overview.uiFlags.isFetchingFirstContactsSummary = flag;
  },
  [types.default.SET_ACCOUNT_SUMMARY](_state, summaryData) {


    _state.accountSummary = summaryData;
  },
  [types.default.SET_BOT_SUMMARY](_state, summaryData) {
    _state.botSummary = summaryData;
  },
  [types.default.SET_ACCOUNT_CONVERSATION_METRIC](_state, metricData) {
    _state.overview.accountConversationMetric = metricData;
  },
  [types.default.TOGGLE_ACCOUNT_CONVERSATION_METRIC_LOADING](_state, flag) {
    _state.overview.uiFlags.isFetchingAccountConversationMetric = flag;
  },
  [types.default.SET_AGENT_CONVERSATION_METRIC](_state, metricData) {
    _state.overview.agentConversationMetric = metricData;
  },
  [types.default.TOGGLE_AGENT_CONVERSATION_METRIC_LOADING](_state, flag) {
    _state.overview.uiFlags.isFetchingAgentConversationMetric = flag;
  },
  [types.default.SET_TEAM_CONVERSATION_METRIC](_state, metricData) {
    _state.overview.teamConversationMetric = metricData;
  },
  [types.default.TOGGLE_TEAM_CONVERSATION_METRIC_LOADING](_state, flag) {
    _state.overview.uiFlags.isFetchingTeamConversationMetric = flag;
  },
  SET_CHANNEL_METRICS(_state, metrics) {
    _state.overview.channelMetrics = metrics;
  },
  SET_CHANNEL_METRICS_UI_FLAG(_state, flag) {
    _state.overview.uiFlags.isFetchingChannelMetrics = flag;
  },
  SET_CAMPAIGN_METRICS(_state, metrics) {
    _state.overview.campaignMetrics = metrics;
  },
  SET_CAMPAIGN_METRICS_UI_FLAG(_state, flag) {
    _state.overview.uiFlags.isFetchingCampaignMetrics = flag;
  },
};

export default {
  state,
  getters,
  actions,
  mutations,
};
