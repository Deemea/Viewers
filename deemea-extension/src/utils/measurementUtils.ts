import * as cs3dTools from '@cornerstonejs/tools';
import { axis } from './axisColors';
import { angles } from './angleColors';
import { points } from './pointsColors';
import { Palette } from './palette';
import { boxes } from './boxColors';
import { RelatedPoint } from './relatedPoint';

function convertFromDicomCoordinates(
  dicomX,
  dicomY,
  dicomZ,
  imageWidth,
  imageHeight,
  pixelSpacingX,
  pixelSpacingY,
  imagePositionPatient,
  orientationMatrix
) {
  // Step 1: Calculate the difference vector from the Image Position (Patient)
  const diffX = dicomX - imagePositionPatient[0];
  const diffY = dicomY - imagePositionPatient[1];
  const diffZ = dicomZ - imagePositionPatient[2];

  // Step 2: Extract row and column direction vectors from the orientation matrix
  const rowDir = [orientationMatrix[0], orientationMatrix[1], orientationMatrix[2]]; // [rx, ry, rz]
  const colDir = [orientationMatrix[3], orientationMatrix[4], orientationMatrix[5]]; // [cx, cy, cz]

  // Step 3: Project the difference vector onto the row and column directions to get physical coordinates
  const physicalX = diffX * rowDir[0] + diffY * rowDir[1] + diffZ * rowDir[2];
  const physicalY = diffX * colDir[0] + diffY * colDir[1] + diffZ * colDir[2];

  // Step 4: Convert physical coordinates to pixel coordinates using pixel spacing
  const pixelX = physicalX / pixelSpacingX;
  const pixelY = physicalY / pixelSpacingY;

  // Step 5: Normalize pixel coordinates to the range [0, 1]
  const normalizedX = pixelX / imageWidth;
  const normalizedY = pixelY / imageHeight;

  return [normalizedX, normalizedY];
}

function convertToDicomCoordinates(
  normalizedX,
  normalizedY,
  imageWidth,
  imageHeight,
  pixelSpacingX,
  pixelSpacingY,
  imagePositionPatient,
  orientationMatrix
) {
  // Step 1: Convert normalized coordinates (0 to 1) to pixel coordinates (0 to imageWidth/Height)
  const pixelX = normalizedX * imageWidth;
  const pixelY = normalizedY * imageHeight;

  // Step 2: Convert pixel coordinates to physical distance in mm using pixel spacing
  const physicalX = pixelX * pixelSpacingX;
  const physicalY = pixelY * pixelSpacingY;

  // Step 3: Use the Image Orientation (Patient) matrix to convert to physical coordinates
  const rowDir = [orientationMatrix[0], orientationMatrix[1], orientationMatrix[2]]; // [rx, ry, rz]
  const colDir = [orientationMatrix[3], orientationMatrix[4], orientationMatrix[5]]; // [cx, cy, cz]

  // Compute DICOM coordinates
  const dicomX = imagePositionPatient[0] + physicalX * rowDir[0] + physicalY * colDir[0];
  const dicomY = imagePositionPatient[1] + physicalX * rowDir[1] + physicalY * colDir[1];
  const dicomZ = imagePositionPatient[2] + physicalX * rowDir[2] + physicalY * colDir[2];

  return [dicomX, dicomY, dicomZ];
}

async function matchNameWithAxis(
  pointName1,
  pointName2
): Promise<{ color: string; highlighted: string; dotted?: boolean } | null> {
  const matchedAxis = axis.find(
    axe =>
      (pointName1 === axe.head && pointName2 === axe.tail) ||
      (pointName2 === axe.head && pointName1 === axe.tail)
  );

  return matchedAxis ? matchedAxis : null;
}

async function matchNameWithAngle(
  pointName1,
  pointName2,
  pointName3
): Promise<{ color: string; highlighted: string; dotted?: boolean } | null> {

  const matchedAngle = angles.find(
    angle =>
      (pointName1 === angle.head && pointName2 === angle.middle && pointName3 === angle.tail) ||
      (pointName3 === angle.head && pointName2 === angle.middle && pointName1 === angle.tail) ||
      (pointName2 === angle.head && pointName3 === angle.middle && pointName1 === angle.tail) ||
      (pointName2 === angle.head && pointName1 === angle.middle && pointName3 === angle.tail) ||
      (pointName3 === angle.head && pointName1 === angle.middle && pointName2 === angle.tail) ||
      (pointName1 === angle.head && pointName3 === angle.middle && pointName2 === angle.tail)
  );

  return matchedAngle ? matchedAngle : null;
}

async function matchNameWithPoint(
  pointName
): Promise<{ color: string; highlighted: string } | null> {
  const matchedPoint = points.find(point => pointName === point.name);

  return matchedPoint ? matchedPoint : null;
}

async function matchNameWithBox(pointName): Promise<{ color: string; highlighted: string } | null> {
  const matchedBox = boxes.find(point => pointName.includes(point.name));

  return matchedBox ? matchedBox : null;
}

async function setMeasurementStyle() {
  const annotations = cs3dTools.annotation.state.getAllAnnotations();
  annotations?.map(async annotation => {
    let style = {
      color: '#00ff00',
      colorHighlighted: '#fff000',
      colorSelected: '#fff000',
      lineDash: '',
    };
    if (annotation.data.handles?.type === 'rectangle') {
      style = {
        color: Palette.Turquoise,
        colorHighlighted: Palette.DarkTurquoise,
        colorSelected: Palette.Turquoise,
        lineDash: '',
      };

      const boxColor = await matchNameWithBox(annotation.data.handles.name);
      if (boxColor) {
        style = {
          color: boxColor.color,
          colorHighlighted: boxColor.highlighted,
          colorSelected: boxColor.highlighted,
          lineDash: '',
        };
      }
    }

    if (annotation.data.handles?.type === 'probe') {
      const pointColor = await matchNameWithPoint(annotation.data.handles.name);

      if (pointColor) {
        style = {
          color: pointColor.color,
          colorHighlighted: pointColor.highlighted,
          colorSelected: pointColor.highlighted,
          lineDash: '',
        };
      }
    }

    if (annotation.data.handles?.type === 'angle') {
      const pointColor = await matchNameWithAngle(
        annotation.data.handles?.headName,
        annotation.data.handles?.middleName,
        annotation.data.handles?.tailName
      );

      if (pointColor) {
        style = {
          color: pointColor.color,
          colorHighlighted: pointColor.highlighted,
          colorSelected: pointColor.highlighted,
          lineDash: '',
        };
      }
    }
    const axisColor = await matchNameWithAxis(
      annotation.data.handles?.headName,
      annotation.data.handles?.tailName
    );

    if (axisColor) {
      style = {
        ...style,
        color: axisColor.color,
        colorHighlighted: axisColor.highlighted,
        colorSelected: axisColor.highlighted,
        lineDash: axisColor.dotted ? '3,2' : '',
      };
    }
    cs3dTools.annotation.config.style.setAnnotationStyles(annotation.annotationUID!, style);
  });
}

function lockMeasurementIfNeeded(data, imageStatus: boolean): void {
  const annotations = cs3dTools.annotation.state.getAllAnnotations();
  annotations?.forEach(annotation => {
    if (
      (annotation.data.label! as unknown as { measurementId: string }).measurementId ===
        data.measurementId &&
      (data.locked === true || imageStatus)
    ) {
      cs3dTools.annotation.locking.setAnnotationLocked(annotation.annotationUID!, true);
    }
  });
}

export async function demonstrateMeasurementService(
  servicesManager,
  relatedPoints: RelatedPoint[],
  imageStatus = false
) {
  const { ViewportGridService, CornerstoneViewportService } = servicesManager.services;

  const viewportId = ViewportGridService.getActiveViewportId();
  const viewport = CornerstoneViewportService.getCornerstoneViewport(viewportId);

  const imageId = viewport.getCurrentImageId();

  const imageMetadata = viewport.getImageData(imageId);

  if (!imageId) {
    console.error('No image ID found');
    return;
  }

  if (!imageMetadata) {
    console.error('No image metadata found');
    return;
  }

  relatedPoints?.forEach(data => {
    if (data.forceHide || data.hide) {
      return;
    } else if (data.points.length === 1) {
      createPoint(viewport, imageMetadata, data, imageId);
    } else if (data.points.length === 2) {
      createLength(viewport, imageMetadata, data, imageId);
    } else if (data.points.length === 3) {
      createAngleROI(viewport, imageMetadata, data, imageId);
    } else if (data.points.length === 4) {
      createRectangleROI(viewport, imageMetadata, data);
    }
    lockMeasurementIfNeeded(data, imageStatus);
    setMeasurementStyle();
  });
}

export function createRectangleROI(viewport, imageMetadata, data: RelatedPoint) {
  try {
    const normalizedPoints = data.points.map(point => {
      const normalizedX = point.x ? point.x : point.xOrigin;
      const normalizedY = point.y ? point.y : point.yOrigin;
      const imageWidth = imageMetadata.dimensions[0];
      const imageHeight = imageMetadata.dimensions[1];
      const pixelSpacingX = imageMetadata.spacing[0];
      const pixelSpacingY = imageMetadata.spacing[1];
      const imagePositionPatient = imageMetadata.origin;
      const orientationMatrix = imageMetadata.direction;

      return convertToDicomCoordinates(
        normalizedX,
        normalizedY,
        imageWidth,
        imageHeight,
        pixelSpacingX,
        pixelSpacingY,
        imagePositionPatient,
        orientationMatrix
      );
    });

    cs3dTools.RectangleROITool.createAndAddAnnotation(viewport, {
      data: {
        label: {
          measurementId: data?.measurementId,
          pointsInfo: data.points,
          predicted: true,
          imagingData: data?.imagingData,
          hide: data.hide || false,
          forceHide: data.forceHide || false,
          locked: data.locked || false,
        },
        handles: {
          points: normalizedPoints,
          type: 'rectangle',
          name: data.points[0].name,
          activeHandleIndex: null,
        },
      },
    });
  } catch (error) {
    console.error('Error adding measurement:', error);
  }
}

export function createPoint(viewport, imageMetadata, data: RelatedPoint, imageId) {
  if (!imageMetadata) {
    console.error('No image metadata found');
    return;
  }

  try {
    const normalizedX = data.points[0].x ? data.points[0].x : data.points[0].xOrigin;
    const normalizedY = data.points[0].y ? data.points[0].y : data.points[0].yOrigin;
    const imageWidth = imageMetadata.dimensions[0];
    const imageHeight = imageMetadata.dimensions[1];
    const pixelSpacingX = imageMetadata.spacing[0];
    const pixelSpacingY = imageMetadata.spacing[1];
    const imagePositionPatient = imageMetadata.origin;
    const orientationMatrix = imageMetadata.direction;

    const dicomCoords = convertToDicomCoordinates(
      normalizedX,
      normalizedY,
      imageWidth,
      imageHeight,
      pixelSpacingX,
      pixelSpacingY,
      imagePositionPatient,
      orientationMatrix
    );

    cs3dTools.ProbeTool.createAndAddAnnotation(viewport, {
      data: {
        handles: {
          points: [dicomCoords],
          type: 'probe',
          name: data.points[0].name,
        },
        label: {
          measurementId: data?.measurementId,
          pointsInfo: data.points,
          predicted: true,
          imagingData: data?.imagingData,
          hide: data.hide || false,
          forceHide: data.forceHide || false,
          locked: data.locked || false,
        },
        cachedStats: {
          [`imageId:${imageId}`]: {
            length: 'X',
            unit: 'px',
          },
        },
      },
    });
  } catch (error) {
    console.error('Error adding measurement:', error);
  }
}

export function createLength(viewport, imageMetadata, data: RelatedPoint, imageId) {
  if (!imageMetadata) {
    console.error('No image metadata found');
    return;
  }

  try {
    const normalizedX = data.points[0].x ? data.points[0].x : data.points[0].xOrigin;
    const normalizedY = data.points[0].y ? data.points[0].y : data.points[0].yOrigin;
    const imageWidth = imageMetadata.dimensions[0];
    const imageHeight = imageMetadata.dimensions[1];
    const pixelSpacingX = imageMetadata.spacing[0];
    const pixelSpacingY = imageMetadata.spacing[1];
    const imagePositionPatient = imageMetadata.origin;
    const orientationMatrix = imageMetadata.direction;

    const dicomCoords = convertToDicomCoordinates(
      normalizedX,
      normalizedY,
      imageWidth,
      imageHeight,
      pixelSpacingX,
      pixelSpacingY,
      imagePositionPatient,
      orientationMatrix
    );

    const normalizedX2 = data.points[1].x ? data.points[1].x : data.points[1].xOrigin;
    const normalizedY2 = data.points[1].y ? data.points[1].y : data.points[1].yOrigin;
    const imageWidth2 = imageMetadata.dimensions[0];
    const imageHeight2 = imageMetadata.dimensions[1];
    const pixelSpacingX2 = imageMetadata.spacing[0];
    const pixelSpacingY2 = imageMetadata.spacing[1];
    const imagePositionPatient2 = imageMetadata.origin;
    const orientationMatrix2 = imageMetadata.direction;

    const dicomCoords2 = convertToDicomCoordinates(
      normalizedX2,
      normalizedY2,
      imageWidth2,
      imageHeight2,
      pixelSpacingX2,
      pixelSpacingY2,
      imagePositionPatient2,
      orientationMatrix2
    );

    cs3dTools.LengthTool.createAndAddAnnotation(viewport, {
      data: {
        handles: {
          points: [dicomCoords, dicomCoords2],
          headName: data.points[0].name,
          tailName: data.points[1].name,
          name: data.points[0].name,
        },
        label: {
          measurementId: data?.measurementId,
          pointsInfo: data.points,
          predicted: true,
          imagingData: data?.imagingData,
          hide: data.hide || false,
          forceHide: data.forceHide || false,
          locked: data.locked || false,
        },
        cachedStats: {
          [`imageId:${imageId}`]: {
            length: 'X',
            unit: 'px',
          },
        },
      },
    });
  } catch (error) {
    console.error('Error adding measurement:', error);
  }
}

export function createAngleROI(viewport, imageMetadata, data: RelatedPoint, imageId) {
  if (!imageMetadata) {
    console.error('No image metadata found');
    return;
  }

  try {
    const normalizedPoints = data.points.map(point => {
      const normalizedX = point.x ? point.x : point.xOrigin;
      const normalizedY = point.y ? point.y : point.yOrigin;
      const imageWidth = imageMetadata.dimensions[0];
      const imageHeight = imageMetadata.dimensions[1];
      const pixelSpacingX = imageMetadata.spacing[0];
      const pixelSpacingY = imageMetadata.spacing[1];
      const imagePositionPatient = imageMetadata.origin;
      const orientationMatrix = imageMetadata.direction;

      return convertToDicomCoordinates(
        normalizedX,
        normalizedY,
        imageWidth,
        imageHeight,
        pixelSpacingX,
        pixelSpacingY,
        imagePositionPatient,
        orientationMatrix
      );
    });

    cs3dTools.AngleTool.createAndAddAnnotation(viewport, {
      data: {
        handles: {
          points: normalizedPoints,
          headName: data.points[0].name,
          middleName: data.points[1].name,
          tailName: data.points[2].name,
          type: 'angle',
          name: data.points[0].name,
        },
        label: {
          measurementId: data?.measurementId,
          pointsInfo: data.points,
          predicted: true,
          imagingData: data?.imagingData,
          hide: data.hide || false,
          forceHide: data.forceHide || false,
          locked: data.locked || false,
        },
        cachedStats: {
          [`imageId:${imageId}`]: {
            length: 'X',
            unit: 'px',
          },
        },
      },
    });
  } catch (error) {
    console.error('Error adding measurement:', error);
  }
}

export async function createMeasurement(servicesManager, points) {
  const { ViewportGridService, CornerstoneViewportService } = servicesManager.services;

  const viewportId = ViewportGridService.getActiveViewportId();
  const viewport = CornerstoneViewportService.getCornerstoneViewport(viewportId);

  const imageId = viewport.getCurrentImageId();

  const imageMetadata = viewport.getImageData(imageId);

  const imageWidth = imageMetadata.dimensions[0];
  const imageHeight = imageMetadata.dimensions[1];
  const pixelSpacingX = imageMetadata.spacing[0];
  const pixelSpacingY = imageMetadata.spacing[1];
  const imagePositionPatient = imageMetadata.origin;
  const orientationMatrix = imageMetadata.direction;

  const normalizedPoints: number[][] = [];
  points?.forEach(point => {
    const normalizedCoords = convertFromDicomCoordinates(
      point[0],
      point[1],
      point[2],
      imageWidth,
      imageHeight,
      pixelSpacingX,
      pixelSpacingY,
      imagePositionPatient,
      orientationMatrix
    );
    normalizedPoints.push(normalizedCoords);
  });

  return normalizedPoints;
}
