import CD from 'cropduster';
import environment from './environment';

const hosts = {
  development: '',
  staging: 'https://sorcerer-staging.movableink-templates.com',
  production: 'https://sorcerer.movableink-templates.com'
};

const sorcererUrlBase = `${hosts[environment]}/data_sources/`;

function toParamString(object) {
  return Object.keys(object)
    .map(key => [key, object[key]].map(encodeURIComponent).join('='))
    .join('&');
}

class DataSource {
  constructor({ key }) {
    this.key = key;
  }

  getRawData(params) {
    const url = [sorcererUrlBase, this.key, '?', toParamString(params)].join(
      ''
    );

    return CD.get(url);
  }
}

export default DataSource;
