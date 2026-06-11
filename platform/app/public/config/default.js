/** @type {AppTypes.Config} */

import { datasources } from './datasources';

window.config = {
  name: 'config/default.js',
  routerBasename: null,
  // whiteLabeling: {},
  extensions: [],
  modes: [],
  customizationService: {},
  showStudyList: false,
  // some windows systems have issues with more than 3 web workers
  maxNumberOfWebWorkers: 3,
  // below flag is for performance reasons, but it might not work for all servers
  showWarningMessageForCrossOrigin: true,
  showCPUFallbackMessage: true,
  showLoadingIndicator: true,
  experimentalStudyBrowserSort: false,
  strictZSpacingForVolumeViewport: true,
  useSharedArrayBuffer: 'FALSE',
  groupEnabledModesFirst: true,
  allowMultiSelectExport: false,
  dicomUploadEnabled: true,
  investigationalUseDialog: {
    option: 'never',
  },
  disableConfirmationPrompts: true,
  maxNumRequests: {
    interaction: 300,
    thumbnail: 2,
    prefetch: 30,
  },
  studyPrefetcher: {
    enabled: true,
    displaySetsCount: 4,
    maxNumPrefetchRequests: 20,
    order: 'closest',
  },
  defaultDataSourceName: 'dicomweb',
  // Defines multi-monitor layouts
  multimonitor: [
    {
      id: 'split',
      test: ({ multimonitor }) => multimonitor === 'split',
      screens: [
        {
          id: 'ohif0',
          screen: null,
          location: {
            screen: 0,
            width: 0.5,
            height: 1,
            left: 0,
            top: 0,
          },
          options: 'location=no,menubar=no,scrollbars=no,status=no,titlebar=no',
        },
        {
          id: 'ohif1',
          screen: null,
          location: {
            width: 0.5,
            height: 1,
            left: 0.5,
            top: 0,
          },
          options: 'location=no,menubar=no,scrollbars=no,status=no,titlebar=no',
        },
      ],
    },

    {
      id: '2',
      test: ({ multimonitor }) => multimonitor === '2',
      screens: [
        {
          id: 'ohif0',
          screen: 0,
          location: {
            width: 1,
            height: 1,
            left: 0,
            top: 0,
          },
          options: 'fullscreen=yes,location=no,menubar=no,scrollbars=no,status=no,titlebar=no',
        },
        {
          id: 'ohif1',
          screen: 1,
          location: {
            width: 1,
            height: 1,
            left: 0,
            top: 0,
          },
          options: 'fullscreen=yes,location=no,menubar=no,scrollbars=no,status=no,titlebar=no',
        },
      ],
    },
  ],
  dangerouslyUseDynamicConfig: {
    enabled: true,
    // Only allow config URLs from trusted deemea.com subdomains or localhost (dev)
    regex:
      /(https:\/\/[a-zA-Z0-9-]+\.deemea\.com(\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]*)*)|(http:\/\/localhost(:[0-9]+)?(\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]*)*)/,
  },
  dataSources: datasources,
  httpErrorHandler: error => {
    // This is 429 when rejected from the public idc sandbox too often.
    // console.warn(error.status);
    // Could use services manager here to bring up a dialog/modal if needed.
    // console.warn('test, navigate to https://ohif.org/');
  },
  // whiteLabeling: {
  //   createLogoComponentFn: function (React) {
  //     return React.createElement(
  //       'a',
  //       {
  //         target: '_self',
  //         rel: 'noopener noreferrer',
  //         className: 'text-purple-600 line-through',
  //         href: '_X___IDC__LOGO__LINK___Y_',
  //       },
  //       React.createElement('img', {
  //         src: './Logo.svg',
  //         className: 'w-14 h-14',
  //       })
  //     );
  //   },
  // },
};
