/** @type {AppTypes.Config} */
// Development environment configuration.
// Built with: APP_CONFIG=config/dev.js
const { baseConfig, createDataSources, createCognitoOidc } = window.deemeaConfig;

window.config = {
  ...baseConfig,
  name: 'config/dev.js',
  // OIDC values injected at container startup by entrypoint.sh
  oidc: createCognitoOidc('%COGNITO_USER_POOL_ID%', '%COGNITO_USER_POOL_CLIENT_ID%'),
  defaultDataSourceName: 'DEV_SANTY',
  dangerouslyUseDynamicConfig: {
    enabled: true,
    regex:
      /(https:\/\/[a-zA-Z0-9-]+\.deemea\.com(\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]*)*)|(http:\/\/localhost(:[0-9]+)?(\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]*)*)/,
  },
  dataSources: createDataSources({
    DEV_SANTY: 'https://santy-dev.deemea.com/api/v1/didier',
    DEV_F4C: 'https://dev.f4c.deemea.com/api/v1/didier',
  }),
};
