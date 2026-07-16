class V2::Reports::CampaignMetricsBuilder
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

      # 2. Get Campaigns associated with allowed inboxes
      campaigns = account.campaigns.where(inbox_id: inbox_ids)
      campaign_ids = campaigns.pluck(:id)
      
      return [] if campaign_ids.empty?

      # 3. Query DB to group metrics by campaign_id to avoid N+1 queries
      conversations_in_range = account.conversations.where(campaign_id: campaign_ids, created_at: since_date..until_date)
      
      total_by_campaign = conversations_in_range.group(:campaign_id).count
      
      # Respondidas por el cliente (tienen al menos un mensaje entrante en las primeras 24 horas)
      replied_conv_ids = conversations_in_range.joins(:messages).where(messages: { message_type: :incoming }).where("messages.created_at <= conversations.created_at + INTERVAL '24 hours'").select(:id).distinct
      replied_by_campaign = conversations_in_range.where(id: replied_conv_ids).group(:campaign_id).count
      
      resolved_by_campaign = conversations_in_range.resolved.group(:campaign_id).count
      
      # Desatendidas: El cliente respondio, pero esta sin resolver/atender por un agente
      unattended_by_campaign = conversations_in_range.where(id: replied_conv_ids).open.unattended.group(:campaign_id).count

      native_campaigns_metrics = campaigns.map do |campaign|
        camp_id = campaign.id
        
        total_count = total_by_campaign[camp_id] || 0
        replied_count = replied_by_campaign[camp_id] || 0
        resolved_count = resolved_by_campaign[camp_id] || 0
        unattended_count = unattended_by_campaign[camp_id] || 0
        
        no_response_count = total_count - replied_count
        no_response_count = 0 if no_response_count < 0

        reply_rate = total_count > 0 ? ((replied_count.to_f / total_count) * 100).round(1) : 0

        channel_type = campaign.inbox.try(:channel_type)
        prefix = case channel_type
                 when 'Channel::WebWidget' then '[LiveChat] '
                 when 'Channel::Whatsapp' then '[WhatsApp] '
                 when 'Channel::TwilioSms', 'Channel::Sms' then '[SMS] '
                 else ''
                 end

        {
          id: camp_id,
          title: "#{prefix}#{campaign.title}",
          campaign_type: campaign.campaign_type,
          campaign_status: campaign.campaign_status,
          inbox_name: campaign.inbox.try(:name),
          inbox_channel_type: campaign.inbox.try(:channel_type),
          total_conversations: total_count,
          replied_conversations: replied_count,
          no_response_conversations: no_response_count,
          reply_rate: reply_rate,
          resolved_conversations: resolved_count,
          unattended_conversations: unattended_count
        }
      end

      # Buscar mensajes enviados que contengan prefijos conocidos o tengan 'template_params'
      template_messages = account.messages
                                 .where(message_type: :outgoing, created_at: since_date..until_date)
                                 .where("content LIKE 'Plantilla Enviada:%' OR content LIKE 'Template sent:%' OR content LIKE 'Template_send:%' OR additional_attributes->'template_params' IS NOT NULL")

      template_data = {}
      
      template_messages.find_each(batch_size: 1000) do |msg|
        name = if msg.additional_attributes && msg.additional_attributes['template_params'].present?
                 params = msg.additional_attributes['template_params']
                 params.is_a?(Hash) ? (params['name'] || params[:name]) : nil
               else
                 msg.content.sub(/^(Plantilla Enviada:|Template sent:|Template_send:)\s*/i, "").strip
               end
        
        next if name.blank?
        
        template_data[name] ||= { sent: 0, conv_ids: [] }
        template_data[name][:sent] += 1
        template_data[name][:conv_ids] << msg.conversation_id
      end

      template_metrics_array = template_data.map.with_index do |(name, data), index|
        conv_ids = data[:conv_ids].uniq
        total_count = data[:sent]

        # En cuantas de estas conversaciones el cliente respondio (dentro de las primeras 24 horas)
        replied_convs = account.conversations.where(id: conv_ids).joins(:messages).where(messages: { message_type: :incoming }).where("messages.created_at <= conversations.created_at + INTERVAL '24 hours'").distinct
        replied_count = replied_convs.count
        
        # Cuantas de las que respondio el cliente quedaron desatendidas / sin resolver
        unattended_count = replied_convs.open.unattended.count
        
        # Resueltas
        resolved_count = account.conversations.where(id: conv_ids).resolved.count

        no_response_count = total_count - replied_count
        no_response_count = 0 if no_response_count < 0

        reply_rate = total_count > 0 ? ((replied_count.to_f / total_count) * 100).round(1) : 0

        {
          id: "template_#{index}",
          title: "[WhatsApp] #{name}",
          campaign_type: "one_off",
          campaign_status: "completed",
          inbox_name: "WhatsApp",
          inbox_channel_type: "Channel::Whatsapp",
          total_conversations: total_count,
          replied_conversations: replied_count,
          no_response_conversations: no_response_count,
          reply_rate: reply_rate,
          resolved_conversations: resolved_count,
          unattended_conversations: unattended_count
        }
      end

      native_campaigns_metrics + template_metrics_array
    end
  end
end
