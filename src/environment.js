const hosts = {
  'assets.movableink-templates.com': 'production',
  'cartridges.movableink-templates.com': 'production',
  'assets-staging.movableink-templates.com': 'staging',
  'cartridges-staging.movableink-templates.com': 'staging'
};

const host = document.location.hostname;
const environment = hosts[host] || 'development';

export default environment;
