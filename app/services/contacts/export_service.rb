class Contacts::ExportService
  LABELS_COLUMN = 'labels'.freeze
  LABELS_DELIMITER = ','.freeze

  def initialize(account, params)
    @account = account
    @params = params
  end

  def perform
    headers = valid_headers(@params['column_names'])
    contacts_to_export = contacts.to_a
    preload_contact_labels(contacts_to_export) if headers.include?(LABELS_COLUMN)

    csv_data = CSV.generate do |csv|
      csv << headers
      contacts_to_export.each do |contact|
        csv << headers.map { |header| value_for_header(contact, header) }
      end
    end

    "sep=,\n" + csv_data
  end

  private

  def value_for_header(contact, header)
    return contact_labels_by_id.fetch(contact.id, []).join(LABELS_DELIMITER) if header == LABELS_COLUMN

    contact.send(header)
  end

  def approved_labels
    @approved_labels ||= @account.labels.pluck(:title)
  end

  def preload_contact_labels(contacts_to_export)
    contact_ids = contacts_to_export.map(&:id)
    return if contact_ids.blank?

    ActsAsTaggableOn::Tagging
      .joins(:tag)
      .where(context: LABELS_COLUMN, taggable_type: 'Contact', taggable_id: contact_ids)
      .where(tags: { name: approved_labels })
      .pluck(:taggable_id, 'tags.name')
      .each { |contact_id, label| contact_labels_by_id[contact_id] << label }
  end

  def contact_labels_by_id
    @contact_labels_by_id ||= Hash.new { |hash, contact_id| hash[contact_id] = [] }
  end

  def contacts
    if @params[:payload].present? && @params[:payload].any?
      result = ::Contacts::FilterService.new(@account, nil, @params).perform
      result[:contacts]
    elsif @params[:label].present?
      @account.contacts.resolved_contacts(use_crm_v2: @account.feature_enabled?('crm_v2')).tagged_with(@params[:label], any: true)
    else
      @account.contacts.resolved_contacts(use_crm_v2: @account.feature_enabled?('crm_v2'))
    end
  end

  def valid_headers(column_names)
    requested_headers = column_names.presence || default_columns

    requested_headers.select do |header|
      header == LABELS_COLUMN || Contact.column_names.include?(header)
    end.uniq
  end

  def default_columns
    %w[id name email phone_number company_name labels]
  end
end
