class V2::Reports::FirstContactHeatmapBuilder
  attr_reader :account, :params

  def initialize(account, params)
    @account = account
    @params = params
  end

  def build
    direction = params[:direction] || 'inbound'
    
    # Rango de fechas y zona horaria
    timezone_offset = (params[:timezone_offset] || 0).to_f
    Time.use_zone(ActiveSupport::TimeZone[timezone_offset]) do
      since_date = Time.zone.at(params[:since].to_i)
      until_date = Time.zone.at(params[:until].to_i)
      
      # 1. Obtener TODAS las conversaciones creadas en el rango de fechas
      # Ya no filtramos por "primera histórica de contacto" para permitir que 
      # nuevas conversaciones recurrentes (ej. Plantillas Meta) cuenten.
      conversations = account.conversations.unscoped.where(created_at: since_date..until_date)

      # Chatwoot sometimes passes inbox_id inside a filter param, but if passed directly:
      if params[:inbox_ids].present? && params[:inbox_ids] != 'undefined' && params[:inbox_ids].to_s != '0'
        # Podría ser un array o string separado por comas
        inbox_ids = params[:inbox_ids].is_a?(Array) ? params[:inbox_ids] : params[:inbox_ids].to_s.split(',')
        conversations = conversations.where(inbox_id: inbox_ids)
      end

      # 3. Encontrar el primer mensaje real (entrante o saliente) de esas conversaciones, excluyendo mensajes de 'actividad' del sistema
      first_msg_ids = Message.unscoped.where(conversation_id: conversations.select(:id), message_type: [:incoming, :outgoing]).group(:conversation_id).select('MIN(id)')
      
      # 4. Filtrar los mensajes dependiendo si es inbound u outbound(meta/email)
      messages = Message.unscoped.where(id: first_msg_ids)

      

      if direction == 'inbound'
        # Inbound: El cliente escribió primero
        messages = messages.where(message_type: :incoming)
      else
        # Outbound: La empresa escribió primero (Cualquier canal)
        messages = messages.where(message_type: :outgoing)
      end


      # 5. Agrupar por hora o día usando group_by_period
      timezone_str = ActiveSupport::TimeZone[timezone_offset]&.name || 'UTC'
      group_by = params[:group_by].presence || 'hour'
      grouped_messages = messages.group_by_period(group_by, 'messages.created_at', default_value: 0, range: since_date..until_date, time_zone: timezone_str).count

      
      format_grouped_data(grouped_messages)

    end
  end

  private

  def format_grouped_data(grouped_messages)
    grouped_messages.map do |datetime, count|
      timestamp = if datetime.is_a?(Date)
                    datetime.in_time_zone.to_i
                  else
                    datetime.to_time.to_i
                  end

      {
        value: count,
        timestamp: timestamp
      }
    end
  end
end
