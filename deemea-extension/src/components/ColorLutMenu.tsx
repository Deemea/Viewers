import React, { ReactElement, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSystem } from '@ohif/core';
import {
  AllInOneMenu,
  Icons,
  Popover,
  PopoverContent,
  PopoverTrigger,
  useIconPresentation,
} from '@ohif/ui-next';
import { Enums } from '@cornerstonejs/core';

// Display labels, the colormap names are kept as is since they are the ones applied and saved
const COLORMAP_LABELS = {
  hsv: 'HSV',
  hot_iron: 'Hot Iron',
  red_hot: 'Red Hot',
  s_pet: 'PET Scan',
  perfusion: 'Perfusion',
  rainbow_2: 'Rainbow 2',
  suv: 'SUV',
  ge_256: 'GE 256',
  ge: 'GE',
  siemens: 'Siemens',
};

// Without colormap, an image keeps its default rendering: grayscale, inverted for MONOCHROME1 images
function getAppliedColormapName(viewport): string | undefined {
  const { colormap, invert } = viewport?.getProperties() ?? {};
  return colormap?.name ?? (invert ? 'X Ray' : 'Grayscale');
}

function ColorLutItems({ viewportId, colormaps }): ReactElement {
  const { t } = useTranslation('WindowLevelActionMenu');
  const { servicesManager, commandsManager } = useSystem();
  const { cornerstoneViewportService } = servicesManager.services;

  const appliedColormapRef = useRef<string>();
  const previewedColormapRef = useRef<string>();

  const applyColormap = (name?: string) => {
    if (!name) {
      return;
    }
    const colormap = colormaps.find(colormap => colormap.Name === name) ?? { name };
    commandsManager.run({
      commandName: 'setViewportColormap',
      commandOptions: { viewportId, colormap, immediate: true },
      context: 'CORNERSTONE',
    });
  };

  useEffect(() => {
    const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
    appliedColormapRef.current = getAppliedColormapName(viewport);

    // The menu can be closed while a colormap is still previewed
    return () => {
      if (previewedColormapRef.current) {
        applyColormap(appliedColormapRef.current);
      }
    };
  }, []);

  return (
    <>
      {colormaps.map(colormap => (
        <AllInOneMenu.Item
          key={colormap.Name}
          label={
            COLORMAP_LABELS[colormap.Name] ??
            t(`Colormaps:${colormap.Name}`, { defaultValue: colormap.Name })
          }
          useIconSpace={false}
          onMouseEnter={() => {
            previewedColormapRef.current = colormap.Name;
            applyColormap(colormap.Name);
          }}
          onMouseLeave={() => {
            previewedColormapRef.current = undefined;
            applyColormap(appliedColormapRef.current);
          }}
          onClick={() => {
            previewedColormapRef.current = undefined;
            appliedColormapRef.current = colormap.Name;
            applyColormap(colormap.Name);
          }}
        />
      ))}
    </>
  );
}

/**
 * Viewport action menu that only lists the Color LUTs, previewed in the viewport on hover.
 */
export function ColorLutMenu(props): ReactElement {
  const {
    viewportId,
    location,
    isOpen = false,
    onOpen,
    onClose,
    disabled,
    onInteraction,
    hasEmbeddedVariantToUse,
    ...rest
  } = props;

  const { servicesManager } = useSystem();
  const { toolbarService, customizationService, cornerstoneViewportService } =
    servicesManager.services;
  const { IconContainer, className: iconClassName, containerProps } = useIconPresentation();

  const { colormaps } = customizationService.getCustomization('cornerstone.colorbar') ?? {};
  const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);

  // Color LUTs do not apply to 3D volume renderings
  if (!colormaps || viewport?.type === Enums.ViewportType.VOLUME_3D) {
    return null;
  }

  const { align, side } = toolbarService.getAlignAndSide(location);

  return (
    <Popover open={isOpen} onOpenChange={open => (open ? onOpen?.() : onClose?.())}>
      <PopoverTrigger asChild className="flex items-center justify-center">
        <div>
          <IconContainer disabled={disabled} {...rest} {...containerProps}>
            <Icons.ViewportWindowLevel className={iconClassName} />
          </IconContainer>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="border-none bg-transparent p-0 shadow-none"
        side={side}
        align={align}
        alignOffset={0}
        sideOffset={5}
      >
        <AllInOneMenu.Menu
          isVisible={true}
          align={align}
          side={side}
          onVisibilityChange={isVisible => !isVisible && onClose?.()}
        >
          <AllInOneMenu.ItemPanel maxHeight="300px">
            <ColorLutItems viewportId={viewportId} colormaps={colormaps} />
          </AllInOneMenu.ItemPanel>
        </AllInOneMenu.Menu>
      </PopoverContent>
    </Popover>
  );
}
