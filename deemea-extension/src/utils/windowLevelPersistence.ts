import { Enums, getEnabledElement } from '@cornerstonejs/core';

type VoiRange = { lower: number; upper: number };
type ViewportState = { range?: VoiRange; hasSavedRange: boolean };

const WINDOW_LEVEL_STORAGE_KEY = 'deemea.windowLevel';
const COLORMAP_STORAGE_KEY = 'deemea.colormap';
const DEEMEA_ROUTES = ['deemea', 'deemea-3d'];
const WINDOW_LEVEL_VIEWPORT_TYPES = [Enums.ViewportType.STACK, Enums.ViewportType.ORTHOGRAPHIC];
// Default rendering of an image (X Ray for MONOCHROME1 ones): choosing one of them, or resetting
// the viewport, goes back to the default instead of saving a colormap
const DEFAULT_COLORMAPS = ['Grayscale', 'X Ray'];

// Keyed by cornerstone viewport instance. A new instance is created each time data is set on a
// viewport, so the events fired while the data loads are ignored until it is registered here.
const viewportStates = new WeakMap<object, ViewportState>();
let initialized = false;

function readSaved(storageKey: string): Record<string, unknown> {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || {};
  } catch (error) {
    return {};
  }
}

function writeSaved(storageKey: string, modality: string, value?: unknown) {
  try {
    const saved = readSaved(storageKey);
    if (value) {
      saved[modality] = value;
    } else {
      delete saved[modality];
    }
    localStorage.setItem(storageKey, JSON.stringify(saved));
  } catch (error) {
    console.warn('Unable to save the viewport display settings', error);
  }
}

// Window level values and colormaps are only comparable within the same modality
function getModality(viewport): string | undefined {
  return viewport.getImageData()?.metadata?.Modality;
}

function isSameRange(a?: VoiRange, b?: VoiRange) {
  return !!a && !!b && a.lower === b.lower && a.upper === b.upper;
}

// Returns nothing while the viewport is still loading its data, or for an overlay volume
function getRegisteredViewport(evt) {
  const viewport = getEnabledElement(evt.currentTarget)?.viewport;
  const { volumeId } = evt.detail;

  if (
    !viewport ||
    !viewportStates.has(viewport) ||
    (volumeId && volumeId !== viewport.getVolumeId?.())
  ) {
    return;
  }

  return viewport;
}

function onVoiModified(evt) {
  const viewport = getRegisteredViewport(evt);
  const modality = viewport && getModality(viewport);
  const { range } = evt.detail;

  if (!modality || !range) {
    return;
  }

  const state = viewportStates.get(viewport);
  const previousRange = state.range;
  state.range = { lower: range.lower, upper: range.upper };

  // Stack viewports flag the VOI as computed when it is the default one of the image
  if (viewport.type === Enums.ViewportType.STACK && viewport.getProperties().isComputedVOI) {
    // Back to the default after a viewport reset: forget the saved window level
    if (state.hasSavedRange) {
      writeSaved(WINDOW_LEVEL_STORAGE_KEY, modality);
      state.hasSavedRange = false;
    }
    return;
  }

  // Volume viewports also emit this event when only the colormap or the inversion changes
  if (isSameRange(state.range, previousRange)) {
    return;
  }

  writeSaved(WINDOW_LEVEL_STORAGE_KEY, modality, state.range);
  state.hasSavedRange = true;
}

function onColormapModified(evt) {
  const viewport = getRegisteredViewport(evt);
  const modality = viewport && getModality(viewport);
  const name = evt.detail.colormap?.name;

  if (!modality || !name) {
    return;
  }

  writeSaved(COLORMAP_STORAGE_KEY, modality, DEFAULT_COLORMAPS.includes(name) ? undefined : name);
}

function restoreDisplaySettings(viewport) {
  const activeRoute = window.location.pathname.split('/')[1];
  if (
    !viewport ||
    !DEEMEA_ROUTES.includes(activeRoute) ||
    !WINDOW_LEVEL_VIEWPORT_TYPES.includes(viewport.type)
  ) {
    return;
  }

  const modality = getModality(viewport);
  const savedRange = readSaved(WINDOW_LEVEL_STORAGE_KEY)[modality] as VoiRange;
  const savedColormap = readSaved(COLORMAP_STORAGE_KEY)[modality] as string;

  try {
    // The window level first, so that the colormap is mapped on the restored range
    if (savedRange) {
      viewport.setProperties({ voiRange: savedRange });
    }
    if (savedColormap) {
      viewport.setProperties({ colormap: { name: savedColormap } });
    }
    viewport.render();
  } catch (error) {
    console.warn('Unable to restore the viewport display settings', error);
  }

  const { voiRange } = viewport.getProperties() ?? {};
  viewportStates.set(viewport, {
    range: voiRange && { lower: voiRange.lower, upper: voiRange.upper },
    hasSavedRange: !!savedRange,
  });
  viewport.element.addEventListener(Enums.Events.VOI_MODIFIED, onVoiModified);
  viewport.element.addEventListener(Enums.Events.COLORMAP_MODIFIED, onColormapModified);
}

/**
 * Saves the window level and the colormap (Color LUT) chosen by the user in the localStorage (one
 * per modality) and applies them to the next images that are displayed, including after a page
 * reload.
 */
export function initWindowLevelPersistence(servicesManager) {
  if (initialized) {
    return;
  }
  initialized = true;

  const { cornerstoneViewportService } = servicesManager.services;

  cornerstoneViewportService.subscribe(
    cornerstoneViewportService.EVENTS.VIEWPORT_DATA_CHANGED,
    ({ viewportId }) => {
      restoreDisplaySettings(cornerstoneViewportService.getCornerstoneViewport(viewportId));
    }
  );
}
