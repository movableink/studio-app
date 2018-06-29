const hosts = {
  'assets.movableink-templates.com': 'production',
  'cartridges.movableink-templates.com': 'production',
  'assets-staging.movableink-templates.com': 'staging',
  'cartridges-staging.movableink-templates.com': 'staging',
  'assets-development.movableink-templates.com': 'development',
  'cartridges-development.movableink-templates.com': 'development'
};

const host = document.location.hostname;
const environment = hosts[host] || 'mdk';

export default environment;
