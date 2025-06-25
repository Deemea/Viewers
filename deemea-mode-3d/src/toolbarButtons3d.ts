// TODO: torn, can either bake this here; or have to create a whole new button type
// Only ways that you can pass in a custom React component for render :l
// import {
//   // ListMenu,
//   WindowLevelMenuItem,
// } from '@ohif/ui';
import { defaults, ToolbarService } from '@ohif/core';
import type { Button } from '@ohif/core/types';

const { windowLevelPresets } = defaults;
const { createButton } = ToolbarService;

function _createWwwcPreset(preset, title, subtitle) {
  return {
    id: preset.toString(),
    title,
    subtitle,
    commands: [
      {
        commandName: 'setWindowLevel',
        commandOptions: {
          ...windowLevelPresets[preset],
        },
        context: 'CORNERSTONE',
      },
    ],
  };
}

export const setToolActiveToolbar = {
  commandName: 'setToolActiveToolbar',
  commandOptions: {
    toolGroupIds: ['default', 'mpr', 'SRToolGroup', 'volume3d'],
  },
};

const toolbarButtons: Button[] = [
  {
    id: 'ResetButton',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'icon-transferring',
      label: 'Reset predictions',
      tooltip: 'Reset Button',
      commands: {
        commandName: 'resetPoints',
        context: 'VIEWER',
      },
    },
  },
  {
    id: 'Length',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-length',
      label: 'Length',
      tooltip: 'Length',
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'RectangleROI',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-rectangle',
      label: 'Rectangle',
      tooltip: 'Rectangle',
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'Angle',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-angle',
      label: 'Angle',
      tooltip: 'Angle',
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'Probe',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-probe',
      label: 'Probe',
      tooltip: 'Probe',
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'CalibrationLine',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-calibration',
      label: 'Calibration',
      tooltip: 'Calibration',
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  // Window Level
  // {
  //   id: 'WindowLevel',
  //   uiType: 'ohif.toolButtonList',
  //   props: {
  //     groupId: 'WindowLevel',
  //     primary: createButton({
  //       id: 'WindowLevel',
  //       icon: 'tool-window-level',
  //       label: 'Window Level',
  //       tooltip: 'Window Level',
  //       commands: setToolActiveToolbar,
  //       evaluate: 'evaluate.cornerstoneTool',
  //     }),
  //     secondary: {
  //       icon: 'chevron-down',
  //       label: 'W/L Manual',
  //       tooltip: 'W/L Presets',
  //     },
  //     renderer: WindowLevelMenuItem,
  //     items: [
  //       _createWwwcPreset(1, 'Soft tissue', '400 / 40'),
  //       _createWwwcPreset(2, 'Lung', '1500 / -600'),
  //       _createWwwcPreset(3, 'Liver', '150 / 90'),
  //       _createWwwcPreset(4, 'Bone', '2500 / 480'),
  //       _createWwwcPreset(5, 'Brain', '80 / 40'),
  //     ],
  //   },
  // },
  // Pan...
  {
    id: 'Pan',
    uiType: 'ohif.toolButton',
    props: {
      type: 'tool',
      icon: 'tool-move',
      label: 'Pan',
      tooltip: 'Pan',
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'Layout',
    uiType: 'ohif.layoutSelector',
    props: {
      rows: 3,
      columns: 4,
      tooltip: 'Layout',
      evaluate: 'evaluate.action',
      commands: 'setViewportGridLayout',
    },
  },
  {
    id: 'Zoom',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-zoom',
      label: 'Zoom',
      tooltip: 'Zoom',
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'Reset',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-reset',
      tooltip: 'Reset View',
      label: 'Reset image position',
      commands: [
        {
          commandName: 'resetViewport',
          context: 'CORNERSTONE',
        },
      ],
      evaluate: 'evaluate.action',
    },
  },
];

export default toolbarButtons;
