import * as cornerstoneTools from '@cornerstonejs/tools';
import { updateSegmentationStats } from './updateSegmentationStats';
import { DicomMetadataStore } from '@ohif/core';
import { OHIFMessageType } from 'deemea-extension/src/utils/enums';
import axios from 'axios';
import { useSelectedSegmentationsForViewportStore } from '../stores';
import { SegmentationRepresentations } from '@cornerstonejs/tools/enums';

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
  // A flag to indicate if the event is unsubscribed to. This is important because
  // the debounced callback does an await and in that period of time the event may have
  // been unsubscribed.
  let isUnsubscribed = false;
  const { unsubscribe: debouncedUnsubscribe } = segmentationService.subscribeDebounced(
    segmentationService.EVENTS.SEGMENTATION_DATA_MODIFIED,
    async ({ segmentationId, action }) => {
      const waitingMessage = uiNotificationService.show({
        title: 'Updating the segmentations...',
        type: 'loading',
        duration: 5000,
      });

      const disableUpdateSegmentationStats = customizationService.getCustomization(
        'panelSegmentation.disableUpdateSegmentationStats'
      );

      const segmentation = segmentationService.getSegmentation(segmentationId);

      if (!segmentation || disableUpdateSegmentationStats) {
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

      if (updatedSegmentation || action === 'RENAME' || action === 'REMOVE') {
        if (!updatedSegmentation?.segments) {
          uiNotificationService.show({
            title: 'Browse all the slices to update the segmentation name',
            type: 'warning',
            duration: 8000,
          });

          return;
        }
      if (!isUnsubscribed && updatedSegmentation) {
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
          naturalizedReport.SeriesDescription = 'Deemea segmentation';

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
      }
    },
    500
  );

  const unsubscribe = () => {
    isUnsubscribed = true;
    debouncedUnsubscribe();
  };
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

      const toRemoveUIDs = bidirectionalAnnotationsToRemove.map(
        annotation => annotation.annotationUID
      );

      toRemoveUIDs.forEach(uid => {
        cornerstoneTools.annotation.state.removeAnnotation(uid);
      });
    }
  );

  return { unsubscribe };
}

/**
 * Sets up auto tab switching for when the first segmentation is added into the viewer.
 */
export function setUpSelectedSegmentationsForViewportHandler({ segmentationService }) {
  const selectedSegmentationsForViewportEvents = [
    segmentationService.EVENTS.SEGMENTATION_MODIFIED,
    segmentationService.EVENTS.SEGMENTATION_REPRESENTATION_MODIFIED,
  ];

  const unsubscribeSelectedSegmentationsForViewportEvents = selectedSegmentationsForViewportEvents
    .map(eventName =>
      segmentationService.subscribe(eventName, event => {
        const { viewportId } = event;

        if (!viewportId) {
          return;
        }

        const { selectedSegmentationsForViewport, setSelectedSegmentationsForViewport } =
          useSelectedSegmentationsForViewportStore.getState();

        const representations = segmentationService.getSegmentationRepresentations(viewportId);

        const activeRepresentation = representations.find(representation => representation.active);

        const typeToSegmentationIdMap =
          selectedSegmentationsForViewport[viewportId] ??
          new Map<SegmentationRepresentations, string>();

        if (activeRepresentation) {
          typeToSegmentationIdMap.set(
            activeRepresentation.type,
            activeRepresentation.segmentationId
          );
        } else {
          typeToSegmentationIdMap.clear();
        }

        setSelectedSegmentationsForViewport(viewportId, typeToSegmentationIdMap);
      })
    )
    .map(subscription => subscription.unsubscribe);

  return { unsubscribeSelectedSegmentationsForViewportEvents };
}
