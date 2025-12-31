export default {
  'layoutSelector.advancedPresetGenerator': ({
    servicesManager,
  }: {
    servicesManager: AppTypes.ServicesManager;
  }) => {
    const _areSelectorsValid = (
      hp: AppTypes.HangingProtocol.Protocol,
      displaySets: AppTypes.DisplaySet[],
      hangingProtocolService: AppTypes.HangingProtocolService
    ) => {
      if (!hp.displaySetSelectors || Object.values(hp.displaySetSelectors).length === 0) {
        return true;
      }

      return hangingProtocolService.areRequiredSelectorsValid(
        Object.values(hp.displaySetSelectors),
        displaySets[0]
      );
    };

    const generateAdvancedPresets = ({
      servicesManager,
    }: {
      servicesManager: AppTypes.ServicesManager;
    }) => {
      const { hangingProtocolService, viewportGridService, displaySetService } =
        servicesManager.services;

      const hangingProtocols = Array.from(hangingProtocolService.protocols.values());

      const viewportId = viewportGridService.getActiveViewportId();

      if (!viewportId) {
        return [];
      }
      const displaySetInsaneUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId);

      if (!displaySetInsaneUIDs) {
        return [];
      }

      const displaySets = displaySetInsaneUIDs.map(uid =>
        displaySetService.getDisplaySetByUID(uid)
      );

      return hangingProtocols
        .map(hp => {
          if (!hp.isPreset) {
            return null;
          }

          const areValid = _areSelectorsValid(hp, displaySets, hangingProtocolService);

          return {
            icon: hp.icon,
            title: hp.name,
            commandOptions: {
              protocolId: hp.id,
            },
            disabled: !areValid,
          };
        })
        .filter(preset => preset !== null);
    };

    return generateAdvancedPresets({ servicesManager });
  },
  'layoutSelector.commonPresets': [
    {
      icon: 'layout-common-1x1',
      title: 'Initial',
      commandOptions: {
        numRows: 1,
        numCols: 1,
      },
    },
  ],
};
