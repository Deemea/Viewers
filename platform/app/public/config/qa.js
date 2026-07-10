/** @type {AppTypes.Config} */
// QA environment configuration.
// Built with: APP_CONFIG=config/qa.js
const { baseConfig, createDataSources, createCognitoOidc } = window.deemeaConfig;

window.config = {
  ...baseConfig,
  name: 'config/qa.js',
  // OIDC values injected at container startup by entrypoint.sh
  oidc: createCognitoOidc('%COGNITO_USER_POOL_ID%', '%COGNITO_USER_POOL_CLIENT_ID%'),
  defaultDataSourceName: 'CLOUD_QA',
  dangerouslyUseDynamicConfig: {
    enabled: true,
    regex:
      /https:\/\/[a-zA-Z0-9-]+\.deemea\.com(\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]*)*/,
  },
  dataSources: createDataSources({
    CLOUD_QA: 'https://cloud-qa.deemea.com/api/v1/didier',
    GPU_QA: 'https://gpu.qa.deemea.com/api/v1/didier',
    SANTY: 'https://santy-qa.deemea.com/api/v1/didier',
    QA_F4C: 'https://qa.f4c.deemea.com/api/v1/didier',
  }),
};
