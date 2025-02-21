function initDefaultToolGroup3d(
  extensionManager,
  toolGroupService,
  commandsManager,
  toolGroupId,
  modeLabelConfig
) {
  const utilityModule = extensionManager.getModuleEntry(
    '@ohif/extension-cornerstone.utilityModule.tools'
  );

  const { toolNames, Enums } = utilityModule.exports;

  const tools = {
    active: [
      {
        toolName: toolNames.WindowLevel,
        bindings: [{ mouseButton: Enums.MouseBindings.Primary }],
      },
      {
        toolName: toolNames.Pan,
        bindings: [{ mouseButton: Enums.MouseBindings.Auxiliary }],
      },
      {
        toolName: toolNames.Zoom,
        bindings: [{ mouseButton: Enums.MouseBindings.Secondary }],
      },
      { toolName: toolNames.StackScrollMouseWheel, bindings: [] },

      { toolName: toolNames.Length },
      { toolName: toolNames.Probe },
      { toolName: toolNames.RectangleROI },
      { toolName: toolNames.Angle },
      { toolName: toolNames.CalibrationLine },
      { toolName: toolNames.Layout },
    ],
    passive: [{ toolName: toolNames.WindowLevelRegion }],
  };

  toolGroupService.createToolGroupAndAddTools(toolGroupId, tools);
}

function initToolGroups3d(extensionManager, toolGroupService, commandsManager, modeLabelConfig) {
  initDefaultToolGroup3d(
    extensionManager,
    toolGroupService,
    commandsManager,
    'default3d',
    modeLabelConfig
  );
}

export default initToolGroups3d;
