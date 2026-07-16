/* global axios */

import ApiClient from './ApiClient';

class CannedResponse extends ApiClient {
  constructor() {
    super('canned_responses', { accountScoped: true });
  }

  get({ searchKey, page }) {
    return axios.get(this.url, {
      params: { search: searchKey, page },
    });
  }
}

export default new CannedResponse();
