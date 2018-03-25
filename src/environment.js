let environment;

const host = document.location.hostname;
if (host.indexOf('assets.movableink-templates.com') >= 0) {
  environment = 'production';
} else if (host.indexOf('assets-staging.movableink-templates.com') >= 0) {
  environment = 'staging';
} else {
  environment = 'development';
}

export default environment;
