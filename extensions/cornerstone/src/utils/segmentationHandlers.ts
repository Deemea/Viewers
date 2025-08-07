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
        const segmentations = segmentationService.getSegmentations();
        console.log('segmentationssegmentations', segmentations);

        const defaultDataSource = extensionManager.getActiveDataSource();
        const generatedData = await commandsManager.run('generateSegmentation', {
          segmentationId,
          options: {
            SeriesDescription: 'TEST SAVE AUTO Description',
          },
        });

        console.log('generatedData', generatedData);

        if (!generatedData || !generatedData.dataset) {
          throw new Error('Error during segmentation generation');
        }

        console.log('GENERATED DATA AUTO', generatedData);

        // const sop = '2.25.469580321458735619682144517728794524840';
        // const series = '2.25.661569102649699786369103167050009005028';
        // const deleteUrl = `http://localhost:8080/dcm4chee-arc/aets/DCM4CHEE/rs/studies/1.2.840.113704.1.111.4556.1312266885.1/series/${series}/reject/113039%5EDCM`;

        // const response = await axios.post(deleteUrl);

        // console.log('responseresponse', response);

        const { dataset: naturalizedReport } = generatedData;
        naturalizedReport.SeriesDescription = 'TEST SAVE AUTO new';
        // naturalizedReport.SOPClassUID = '1.2.840.10008.5.1.4.1.1.66.4';
        // naturalizedReport.SOPInstanceUID = '2.25.724506402023991505305749101187102926116';
        // naturalizedReport.SeriesInstanceUID = '2.25.661569102649699786369103167050009005028';
        console.log('CREATED auto', naturalizedReport);

        await defaultDataSource[0].store.dicom(naturalizedReport);

        // add the information for where we stored it to the instance as well
        naturalizedReport.wadoRoot = defaultDataSource[0].getConfig().wadoRoot;

        DicomMetadataStore.addInstances([naturalizedReport], true);

        window.parent.postMessage(
          {
            type: OHIFMessageType.SAVE_SEGMENTATION,
            message: {
              studyInstanceUID: naturalizedReport.StudyInstanceUID,
              SOPInstanceUID: naturalizedReport.SOPInstanceUID,
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
