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
  commandsManager,
  extensionManager,
}) {
  const { unsubscribe } = segmentationService.subscribeDebounced(
    segmentationService.EVENTS.SEGMENTATION_DATA_MODIFIED,
    async ({ segmentationId }) => {
      const segmentation = segmentationService.getSegmentation(segmentationId);
      const representations = segmentationService.getRepresentationsForSegmentation(segmentationId);

      console.log('representations', representations);

      if (!segmentation) {
        return;
      }

      console.log('segmentation', segmentation);

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

      console.log('updatedSegmentation', updatedSegmentation);

      if (updatedSegmentation) {
        segmentationService.addOrUpdateSegmentation({
          segmentationId,
          segments: updatedSegmentation.segments,
        });
      }

      // SAVE AUTO SEGMENTATION
      try {
        const displaySets = displaySetService.getActiveDisplaySets();
        const segDisplaySets = displaySets.filter(ds => ds.Modality === 'SEG');
        const segmentations = segmentationService.getSegmentations();

        const defaultDataSource = extensionManager.getActiveDataSource();
        const generatedData = await commandsManager.run('generateSegmentation', {
          segmentationId,
          options: {
            SeriesDescription: 'TEST SAVE AUTO Description',
          },
        });

        if (!generatedData || !generatedData.dataset) {
          throw new Error('Error during segmentation generation');
        }

        // Suppression avant ajout pour modification
        console.log('segDisplaySets', segDisplaySets);

        if (segDisplaySets.length > 0) {
          const sop = segDisplaySets[0].SOPInstanceUID;
          const series = segDisplaySets[0].SeriesInstanceUID;
          const study = segDisplaySets[0].StudyInstanceUID;
          console.log('SOP TO DELETE', sop);
          const deleteUrl = `http://localhost:8080/dcm4chee-arc/aets/DCM4CHEE/rs/studies/${study}/series/${series}/reject/113039%5EDCM`;
          await axios.post(deleteUrl);
          displaySetService.deleteDisplaySet(segDisplaySets[0].displaySetInstanceUID);
        }

        const { dataset: naturalizedReport } = generatedData;
        console.log('naturalizedReport', naturalizedReport);

        naturalizedReport.SeriesDescription = 'TEST SAVE AUTO new3';

        await defaultDataSource[0].store.dicom(naturalizedReport);

        // add the information for where we stored it to the instance as well
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

        return naturalizedReport;
      } catch (error) {
        console.debug('Error storing segmentation:', error);
        throw error;
      }
    },
    2000
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
