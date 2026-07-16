class V2::Reports::ChannelMetricsBuilder
  attr_reader :account, :user, :params

  def initialize(account, user, params)
    @account = account
    @user = user
    @params = params
  end

  def build
    timezone_offset = (params[:timezone_offset] || 0).to_f
    Time.use_zone(ActiveSupport::TimeZone[timezone_offset]) do
      since_date = Time.zone.at(params[:since].to_i)
      until_date = Time.zone.at(params[:until].to_i)

      # 1. Filter inboxes by user assignment (only for agents)
      inboxes = if user.administrator?
                  account.inboxes
                else
                  user.inboxes.where(account_id: account.id)
                end

      inbox_ids = inboxes.pluck(:id)

      return [] if inbox_ids.empty?

      # 2. Query DB to group metrics by inbox_id to avoid N+1 queries
      # Date range scoped queries
      conversations_in_range = account.conversations.where(inbox_id: inbox_ids, created_at: since_date..until_date)
      
      resolved_by_inbox = conversations_in_range.resolved.group(:inbox_id).count
      total_by_inbox = conversations_in_range.group(:inbox_id).count

      # Live metrics queries (Scoped to Date Range)
      open_by_inbox = conversations_in_range.open.group(:inbox_id).count
      unattended_by_inbox = conversations_in_range.open.unattended.group(:inbox_id).count

      # Today's local range queries (Force 0 if looking at a past month)
      new_today_by_inbox = {}
      if until_date >= Time.zone.now.beginning_of_day
        today_range = Time.zone.now.beginning_of_day..Time.zone.now.end_of_day
        new_today_by_inbox = account.conversations.where(inbox_id: inbox_ids, created_at: today_range).group(:inbox_id).count
      end

      # Messages in date range (only real messages: incoming + outgoing, excludes activity/system)
      messages_by_inbox = Message.unscoped
                                 .where(account_id: account.id)
                                 .where(message_type: [:incoming, :outgoing])
                                 .where(created_at: since_date..until_date)
                                 .joins(:conversation)
                                 .where(conversations: { inbox_id: inbox_ids })
                                 .group('conversations.inbox_id')
                                 .count

      # 3. Construct response array
      inboxes.map do |inbox|
        inbox_id = inbox.id
        open_count = open_by_inbox[inbox_id] || 0
        unattended_count = unattended_by_inbox[inbox_id] || 0
        resolved_count = resolved_by_inbox[inbox_id] || 0
        new_today_count = new_today_by_inbox[inbox_id] || 0
        total_count = total_by_inbox[inbox_id] || 0
        total_messages = messages_by_inbox[inbox_id] || 0

        resolution_rate = total_count > 0 ? ((resolved_count.to_f / total_count) * 100).round(1) : 0

        {
          id: inbox_id,
          name: inbox.name,
          channel_type: inbox.channel_type,
          medium: inbox.channel.try(:medium),
          open_conversations: open_count,
          unattended_conversations: unattended_count,
          resolved_conversations: resolved_count,
          new_conversations_today: new_today_count,
          total_conversations: total_count,
          total_messages: total_messages,
          resolution_rate: resolution_rate
        }
      end
    end
  end
end
