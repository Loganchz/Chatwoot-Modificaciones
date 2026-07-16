builder_params = {
  direction: 'inbound',
  inbox_ids: nil,
  since: '1782882000',
  until: '1785560399',
  timezone_offset: '-5',
  group_by: 'day'
}
account = Account.first
data = V2::Reports::FirstContactHeatmapBuilder.new(account, builder_params).build
puts data.inspect
