module Api::V2::Accounts::FirstContactHeatmapHelper
  def generate_first_contact_heatmap_report(direction)
    timezone_data = generate_first_contact_heatmap_data_for_timezone(params[:timezone_offset], direction)
    group_traffic_data(timezone_data)
  end

  private

  def group_traffic_data(data)
    result_arr = []
    dates = data.pluck(:date).uniq.sort

    result_arr << (['Start of the hour'] + dates)

    data.group_by { |d| d[:hour] }.each do |hour, items|
      row = [format('%02d:00', hour)]
      grouped_values = items.group_by { |d| d[:date] }

      dates.each do |date|
        row << (grouped_values[date][0][:value] if grouped_values[date].is_a?(Array))
      end
      result_arr << row
    end

    result_arr
  end

  def generate_first_contact_heatmap_data_for_timezone(offset, direction)
    timezone = ActiveSupport::TimeZone[offset]&.name
    timezone_today = DateTime.now.in_time_zone(timezone).beginning_of_day

    timezone_data_raw = generate_first_contact_heatmap_data(timezone_today, offset, direction)

    transform_data(timezone_data_raw, false)
  end

  def generate_first_contact_heatmap_data(date, offset, direction)
    builder_params = {
      direction: direction,
      inbox_ids: params[:inbox_ids],
      since: since_timestamp(date),
      until: until_timestamp(date),
      timezone_offset: offset
    }

    V2::Reports::FirstContactHeatmapBuilder.new(Current.account, builder_params).build
  end

  def transform_data(data, zone_transform)
    # rubocop:disable Rails/TimeZone
    data.map do |d|
      date = zone_transform ? Time.zone.at(d[:timestamp]) : Time.at(d[:timestamp])
      {
        date: date.to_date.to_s,
        hour: date.hour,
        value: d[:value]
      }
    end
    # rubocop:enable Rails/TimeZone
  end

  def since_timestamp(date)
    number_of_days = params[:days_before].present? ? params[:days_before].to_i.days : 6.days
    (date - number_of_days).to_i.to_s
  end

  def until_timestamp(date)
    date.to_i.to_s
  end
end
