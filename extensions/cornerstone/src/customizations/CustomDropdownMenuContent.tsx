import React from 'react';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  Icons,
  useSegmentationTableContext,
  useSegmentationExpanded,
} from '@ohif/ui-next';
import { useTranslation } from 'react-i18next';
import { useSystem } from '@ohif/core/src';
import { ExportSegmentationSubMenuItem } from '../components/ExportSegmentationSubMenuItem';

/**
 * Custom dropdown menu component for segmentation panel that uses context for data
 */
export const CustomDropdownMenuContent = () => {
  const { commandsManager } = useSystem();
  const { t } = useTranslation('SegmentationPanel');
  const {
    onSegmentationAdd,
    onSegmentationRemoveFromViewport,
    onSegmentationEdit,
    onSegmentationDelete,
    exportOptions,
    activeSegmentation,
    activeSegmentationId,
    segmentationRepresentationTypes,
    disableEditing,
  } = useSegmentationTableContext('CustomDropdownMenu');

  // Try to get segmentation data from expanded context first, fall back to table context
  let segmentation;
  let segmentationId;
  let allowExport = false;

  try {
    // Try to get from expanded context
    const context = useSegmentationExpanded();
    segmentation = context.segmentation;
    segmentationId = segmentation.segmentationId;
  } catch (e) {
    // If not in expanded context, fallback to active segmentation from table context
    segmentation = activeSegmentation;
    segmentationId = activeSegmentationId;
  }

  if (!segmentation || !segmentationId) {
    return null;
  }

  // Determine if export is allowed for this segmentation
  if (exportOptions) {
    const exportOption = exportOptions.find(opt => opt.segmentationId === segmentationId);
    allowExport = exportOption?.isExportable || false;
  }

  const actions = {
    storeSegmentation: async (segmentationId, modality = 'SEG') => {
      commandsManager.run({
        commandName: 'storeSegmentation',
        commandOptions: { segmentationId, modality },
        context: 'CORNERSTONE',
      });
    },
    onSegmentationDownloadRTSS: segmentationId => {
      commandsManager.run('downloadRTSS', { segmentationId });
    },
    onSegmentationDownload: segmentationId => {
      commandsManager.run('downloadSegmentation', { segmentationId });
    },
    downloadCSVSegmentationReport: segmentationId => {
      commandsManager.run('downloadCSVSegmentationReport', { segmentationId });
    },
  };

  return (
    <DropdownMenuContent align="start">
      <ExportSegmentationSubMenuItem
        segmentationId={segmentationId}
        segmentationRepresentationType={segmentationRepresentationTypes?.[0]}
        allowExport={allowExport}
        actions={actions}
      />
      <DropdownMenuSeparator />
    </DropdownMenuContent>
  );
};
