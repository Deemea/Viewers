import * as cornerstoneTools from '@cornerstonejs/tools';
import { updateSegmentationStats } from './updateSegmentationStats';
import { DicomMetadataStore } from '@ohif/core';
import { OHIFMessageType } from 'deemea-extension/src/utils/enums';
import axios from 'axios';
/**
 * Sets up the handler for segmentation data modification events
 */
export function setupSegmentationDataModifiedHandler({
  segmentationService,
  customizationService,
  displaySetService,
  uiNotificationService,
  userAuthenticationService,
  commandsManager,
  extensionManager,
}) {
  const { unsubscribe } = segmentationService.subscribeDebounced(
    segmentationService.EVENTS.SEGMENTATION_DATA_MODIFIED,
    async ({ segmentationId, action }) => {
      const waitingMessage = uiNotificationService.show({
        title: 'Updating the segmentations...',
        type: 'loading',
        duration: 5000,
      });

      const segmentation = segmentationService.getSegmentation(segmentationId);

      if (!segmentation) {
        uiNotificationService.hide(waitingMessage);
        return;
      }

      const readableText = customizationService.getCustomization('panelSegmentation.readableText');

      // Check for segments with bidirectional measurements and update them
      const segmentIndices = Object.keys(segmentation.segments)
        .map(index => parseInt(index))
        .filter(index => index > 0);

      for (const segmentIndex of segmentIndices) {
        const segment = segmentation.segments[segmentIndex];
        if (segment?.cachedStats?.namedStats?.bidirectional) {
          // Run the command to update the bidirectional measurement
          commandsManager.runCommand('runSegmentBidirectional', {
            segmentationId,
            segmentIndex,
          });
        }
      }

      const updatedSegmentation = await updateSegmentationStats({
        segmentation,
        segmentationId,
        readableText,
      });

      if (updatedSegmentation || action === 'RENAME') {
        if (!updatedSegmentation?.segments) {
          uiNotificationService.show({
            title: 'Browse all the slices to update the segmentation name',
            type: 'warning',
            duration: 8000,
          });

          return;
        }

        segmentationService.addOrUpdateSegmentation({
          segmentationId,
          segments: updatedSegmentation.segments,
        });

        // SAVE AUTO SEGMENTATION
        try {
          const displaySets = displaySetService.getActiveDisplaySets();
          const segDisplaySets = displaySets.filter(ds => ds.Modality === 'SEG');

          const defaultDataSource = extensionManager.getActiveDataSource();
          const generatedData = await commandsManager.run('generateSegmentation', {
            segmentationId,
          });

          if (!generatedData || !generatedData.dataset) {
            throw new Error('Error during segmentation generation');
          }

          const { dataset: naturalizedReport } = generatedData;
          naturalizedReport.SeriesDescription = 'Deemea custom segmentation';

          await defaultDataSource[0].store.dicom(naturalizedReport);
          naturalizedReport.wadoRoot = defaultDataSource[0].getConfig().wadoRoot;
          DicomMetadataStore.addInstances([naturalizedReport], true);

          window.parent.postMessage(
            {
              type: OHIFMessageType.SAVE_SEGMENTATION,
              message: {
                seriesInstanceUID: naturalizedReport.SeriesInstanceUID,
              },
            },
            '*'
          );

          if (segDisplaySets.length === 1) {
            const series = segDisplaySets[0].SeriesInstanceUID;
            const study = segDisplaySets[0].StudyInstanceUID;
            const deleteUrl = `${defaultDataSource[0].getConfig().wadoRoot}/studies/${study}/series/${series}`;
            await axios.delete(deleteUrl, {
              headers: {
                ...userAuthenticationService.getAuthorizationHeader(),
              },
            });
            displaySetService.deleteDisplaySet(segDisplaySets[0].displaySetInstanceUID);
          }
          uiNotificationService.hide(waitingMessage);
          uiNotificationService.show({
            title: segDisplaySets.length === 1 ? 'Segmentation updated' : 'Segmentation created',
            type: 'success',
            duration: 4000,
          });

          return naturalizedReport;
        } catch (error) {
          uiNotificationService.hide(waitingMessage);
          console.debug('Error storing segmentation:', error);
          throw error;
        }
      }
    },
    500
  );

  return { unsubscribe };
}

/**
 * Sets up the handler for segmentation modification events
 */
export function setupSegmentationModifiedHandler({ segmentationService }) {
  const { unsubscribe } = segmentationService.subscribe(
    segmentationService.EVENTS.SEGMENTATION_MODIFIED,
    async ({ segmentationId }) => {
      const segmentation = segmentationService.getSegmentation(segmentationId);

      if (!segmentation) {
        return;
      }

      const annotationState = cornerstoneTools.annotation.state.getAllAnnotations();
      const bidirectionalAnnotations = annotationState.filter(
        annotation =>
          annotation.metadata.toolName === cornerstoneTools.SegmentBidirectionalTool.toolName
      );

      let toRemoveUIDs = [];
      if (!segmentation) {
        toRemoveUIDs = bidirectionalAnnotations.map(
          annotation => annotation.metadata.segmentationId === segmentationId
        );
        return;
      } else {
        const segmentIndices = Object.keys(segmentation.segments)
          .map(index => parseInt(index))
          .filter(index => index > 0);

        // check if there is a bidirectional data that exists but the segment
        // does not exists anymore we need to remove the bidirectional data
        const bidirectionalAnnotationsToRemove = bidirectionalAnnotations.filter(
          annotation =>
            annotation.metadata.segmentationId === segmentationId &&
            !segmentIndices.includes(annotation.metadata.segmentIndex)
        );

        toRemoveUIDs = bidirectionalAnnotationsToRemove.map(annotation => annotation.annotationUID);
      }

      toRemoveUIDs.forEach(uid => {
        cornerstoneTools.annotation.state.removeAnnotation(uid);
      });
    }
  );

  return { unsubscribe };
}
