/** @type {AppTypes.Config} */
// Local development configuration ONLY.
// Deployed environments use config/dev.js, config/qa.js or config/prod.js
// (selected via the APP_CONFIG build arg / env variable).
const { baseConfig, createDataSources, createCognitoOidc } = window.deemeaConfig;

window.config = {
  ...baseConfig,
  name: 'config/default.js',
  // For local dev, point to the Cognito pool used by the local webapp.
  // These are public identifiers, not secrets — hardcode your dev values here if needed.
  // oidc: createCognitoOidc('%COGNITO_USER_POOL_ID%', '%COGNITO_USER_POOL_CLIENT_ID%'),
  defaultDataSourceName: 'SANDBOX',
  dangerouslyUseDynamicConfig: {
    enabled: true,
    // Only allow config URLs from trusted deemea.com subdomains or localhost (dev)
    regex:
      /(https:\/\/[a-zA-Z0-9-]+\.deemea\.com(\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]*)*)|(http:\/\/localhost(:[0-9]+)?(\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]*)*)/,
  },
  dataSources: createDataSources({
    SANDBOX: 'http://localhost:5020/v1/didier',
  }),
  httpErrorHandler: error => {
    // This is 429 when rejected from the public idc sandbox too often.
    // console.warn(error.status);
    // Could use services manager here to bring up a dialog/modal if needed.
  },
};
