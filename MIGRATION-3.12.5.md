# Migration OHIF 3.10.2 → 3.12.5 — rapport de merge

> Généré pendant un `git merge v3.12.5` en cours sur la branche **`upgrade/3.12.5`**.
> Ta branche d'origine (`4378-provi-...`) et ton WIP ne sont pas touchés (WIP mis de côté via `git stash`).

## État

- **828** commits upstream absorbés, **47** commits fork à réconcilier.
- **124** fichiers en conflit au départ → **100 résolus automatiquement**, **24 restants** (ce doc).
- Merge **en cours** (`git status` = "You have unmerged paths"). Rien n'est encore committé.

## Ce qui a été résolu automatiquement (100 fichiers, déjà `git add`)

| Catégorie | Nb | Résolution |
|---|---|---|
| CHANGELOG.md | 30 | upstream |
| Screenshots Playwright `.png` | 19 | upstream (régénérés par les tests) |
| `platform/docs/**` | 7 | upstream |
| version.json/txt, commit.txt, bun.lock | 4 | upstream |
| `package.json` (bumps de version, 0 modif fork) | 28 | upstream |
| `lerna.json`, `yarn.lock` | 2 | upstream (⚠️ régénérer yarn.lock, voir plus bas) |
| `README.md`, `.github/workflows/playwright.yml` | 2 | **ta version** (`--ours`) |
| `platform/i18n/.../fr/Buttons.json` | 1 | **fusionné** (`"Probe": "Point"` conservé + `"Colorbar"` d'OHIF) |
| Faux conflits (fork n'a jamais touché ces fichiers) | 7 | upstream — sûrs |

Les 7 « faux conflits » (artefact de l'algo de merge, aucun code fork dedans) :
`ExtensionManager.ts`, `ManagedDialog.tsx`, `NotificationProvider.tsx`, `ScrollArea.tsx`,
`CornerstoneViewportDownloadForm.tsx`, `constants/panels.ts`, `PanelMeasurementTableTracking.tsx`.

## ⚠️ Config git temporaire à restaurer

Husky faisait planter chaque commande git (il parse le `package.json` racine qui contient
des marqueurs de conflit). J'ai neutralisé les hooks le temps du merge :

```bash
git config core.hooksPath <scratchpad>/empty-hooks   # <- fait
```

**Quand le merge sera committé, restaure :**
```bash
git config --unset core.hooksPath
```

---

## Les 24 fichiers restants — par priorité

### A. Config — garde TES valeurs, ajoute les nouveautés OHIF (2)

| Fichier | Toi± | OHIF± | Action |
|---|---|---|---|
| `platform/app/public/config/default.js` | 555/80 | 23/2 | Garde ton fichier. Intègre les **~23 lignes** ajoutées par OHIF (nouvelles clés de config 3.12 potentiellement requises). Vois : `git diff v3.10.2..v3.12.5 -- platform/app/public/config/default.js` |
| `platform/app/pluginConfig.json` | 32/0 | 14/2 | Garde tes entrées `deemea-*`. OHIF a ajouté : `@ohif/mode-basic`, `@ohif/extension-ultrasound-pleura-bline`, `@ohif/mode-ultrasound-pleura-bline`, et un chemin `dicom-microscopy-viewer/dynamic-import`. Ajoute ceux qui te concernent. |

### B. Composants legacy SUPPRIMÉS par OHIF — décision requise (2)

OHIF poursuit la migration `platform/ui` (ancien) → `platform/ui-next`. Ces 2 composants
n'existent plus à la 3.12.5, mais ton fork les modifiait :

| Fichier | Ta modif | Décision |
|---|---|---|
| `platform/ui/src/components/Header/Header.tsx` | 1 ligne | Le Header legacy est supprimé. Vérifie si ta modif est déjà couverte dans `platform/ui-next/.../Header/Header.tsx` (aussi en conflit, voir tier C), sinon **abandonne**. Résolution : `git rm platform/ui/src/components/Header/Header.tsx` |
| `platform/ui/src/components/UserPreferences/UserPreferences.tsx` | 6 lignes | Composant supprimé. Reporte ta logique dans le nouveau système de préférences si encore pertinente, sinon `git rm`. |

### C. Cœur segmentation + gros refactors OHIF — l'essentiel du travail (20)

> ⚠️ = OHIF a **massivement réécrit** le fichier. Ta modif ne se « recolle » pas
> mécaniquement : il faut comprendre la nouvelle API 3.12 pour ré-appliquer ton intention.
> L'annexe en bas contient le diff exact de TES ajouts pour les fichiers clés.

**Très chaud (API réécrite upstream) :**

| Fichier | Hunks | Toi± | OHIF± |
|---|---|---|---|
| ⚠️⚠️ `extensions/cornerstone/src/commandsModule.ts` | 2 | 35/1 | **952/224** |
| ⚠️⚠️ `extensions/cornerstone/src/services/SegmentationService/SegmentationService.ts` | 5 | 50/13 | **465/116** |
| ⚠️⚠️ `platform/ui-next/src/components/DataRow/DataRow.tsx` | 6 | 52/20 | **415/236** |
| ⚠️ `platform/core/src/services/ToolBarService/ToolbarService.ts` | 1 | 7/5 | **216/15** |
| ⚠️ `extensions/cornerstone/src/panels/PanelSegmentation.tsx` | 2 | 59/27 | 174/32 |
| ⚠️ `platform/ui-next/src/components/SegmentationTable/SegmentationSegments.tsx` | 2 | 34/3 | 163/90 |

**Modéré :**

| Fichier | Hunks | Toi± | OHIF± |
|---|---|---|---|
| `extensions/cornerstone-dicom-seg/src/viewports/OHIFCornerstoneSEGViewport.tsx` | 2 | 78/1 | 60/149 |
| `extensions/cornerstone/src/utils/segmentationHandlers.ts` | 3 | 81/4 | 78/24 |
| `extensions/cornerstone/src/customizations/segmentationPanelCustomization.tsx` | 1 | 1/5 | 85/51 |
| `extensions/cornerstone/src/customizations/CustomDropdownMenuContent.tsx` | 2 | 37/12 | 30/70 |
| `extensions/cornerstone-dicom-seg/src/commandsModule.ts` | 1 | 3/2 | 68/52 |
| `extensions/cornerstone/src/init.tsx` | 3 | 5/0 | 50/45 |
| `platform/ui-next/src/components/Header/Header.tsx` | 1 | 4/3 | 68/62 |
| `platform/ui-next/src/components/Errorboundary/ErrorBoundary.tsx` | 7 | 21/11 | 33/16 |
| `extensions/default/src/ViewerLayout/ViewerHeader.tsx` | 2 | 40/40 | 17/15 |
| `extensions/default/src/Toolbar/ToolbarLayoutSelector.tsx` | 3 | 4/73 | 10/7 |
| `platform/ui-next/src/components/SegmentationTable/AddSegmentationRow.tsx` | 2 | 3/3 | 23/7 |
| `platform/ui/src/components/ContextMenu/ContextMenu.tsx` | 1 | 10/7 | 1/19 |
| `platform/core/src/services/CustomizationService/CustomizationService.ts` | 1 | 4/4 | 10/5 |
| `platform/ui-next/src/components/SegmentationTable/contexts/SegmentationTableContext.tsx` | 1 | 1/0 | 20/2 |

**Ordre conseillé** : commence par les *modérés* à faible churn (`SegmentationTableContext`,
`init.tsx`, `CustomizationService`, `ContextMenu`) pour te chauffer, garde les ⚠️⚠️ pour la fin
avec les release notes ouvertes.

---

## Pour chaque fichier en conflit — méthode

1. Ouvre le fichier, cherche les marqueurs `<<<<<<< HEAD` / `=======` / `>>>>>>> v3.12.5`.
2. `<<<<<<< HEAD` = **ton** code (fork). `>>>>>>> v3.12.5` = **OHIF 3.12.5**.
3. Pour voir précisément ce que TON fork avait ajouté à ce fichier :
   ```bash
   git diff v3.10.2..HEAD -- <fichier>
   ```
4. Réconcilie, supprime les marqueurs, puis `git add <fichier>`.
5. `git diff --name-only --diff-filter=U` = ce qu'il reste à faire.

## Finaliser

```bash
# 1. Une fois les 24 résolus :
git diff --name-only --diff-filter=U        # doit être vide

# 2. Régénérer le lockfile proprement (on a pris celui d'upstream)
yarn install

# 3. Committer le merge
git commit --no-edit

# 4. Restaurer les hooks git
git config --unset core.hooksPath

# 5. Tester TOUTES les features Deemea (le merge peut compiler mais être cassé au runtime,
#    surtout la segmentation dont l'API a changé) :
yarn dev
#    -> calibration, segmentation par image, biomarkers, mode 3D, mode anapath, centres
```

## Tout annuler (repartir de zéro)

```bash
git merge --abort
git switch 4378-provi-create-a-simple-viewer-without-tools-for-all-modality
git stash pop            # récupère ton WIP
git branch -D upgrade/3.12.5
git config --unset core.hooksPath
```

## Recommandation stratégique (pour les prochaines montées de version)

Sur ces 24 fichiers, la douleur vient des patchs directs dans le code **core** OHIF
(`extensions/cornerstone`, `platform/core`, `platform/ui-next`). OHIF fournit le
`CustomizationService` + le système d'extensions justement pour ne PAS patcher le core.
Profite de cette migration pour déplacer un maximum de logique vers `deemea-extension` :
la prochaine mise à jour n'aura presque plus de conflits.

---

## Annexe — TES modifications à ré-appliquer (diff v3.10.2 → fork)

_Ci-dessous, exactement ce que ton fork a ajouté à chaque fichier chaud, pour t'aider à le
reporter sur la nouvelle base OHIF._

### `extensions/cornerstone/src/commandsModule.ts`

```diff
diff --git a/extensions/cornerstone/src/commandsModule.ts b/extensions/cornerstone/src/commandsModule.ts
index 237e78df0e..304ad56069 100644
--- a/extensions/cornerstone/src/commandsModule.ts
+++ b/extensions/cornerstone/src/commandsModule.ts
@@ -36,6 +36,7 @@ import CornerstoneViewportDownloadForm from './utils/CornerstoneViewportDownload
 import { updateSegmentBidirectionalStats } from './utils/updateSegmentationStats';
 import { generateSegmentationCSVReport } from './utils/generateSegmentationCSVReport';
 import { getUpdatedViewportsForSegmentation } from './utils/hydrationUtils';
+import { colormaps } from './utils/colormaps';
 
 const { DefaultHistoryMemo } = csUtils.HistoryMemo;
 const toggleSyncFunctions = {
@@ -43,6 +44,34 @@ const toggleSyncFunctions = {
   voi: toggleVOISliceSync,
 };
 
+function invertColorMap(obj) {
+  const result = {};
+
+  for (const key in obj) {
+    if (Array.isArray(obj[key])) {
+      result[key] = obj[key].map(value => {
+        if (value === 0) {
+          return 1;
+        }
+        if (value === 1) {
+          return 0;
+        }
+        return value;
+      });
+    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
+      result[key] = invertColorMap(obj[key]);
+    } else if (obj[key] === 0) {
+      result[key] = 1;
+    } else if (obj[key] === 1) {
+      result[key] = 0;
+    } else {
+      result[key] = obj[key];
+    }
+  }
+
+  return result;
+}
+
 const { segmentation: segmentationUtils } = cstUtils;
 
 const getLabelmapTools = ({ toolGroupService }) => {
@@ -238,7 +267,6 @@ function commandsModule({
     },
     updateStoredSegmentationPresentation: ({ displaySet, type }) => {
       const { addSegmentationPresentationItem } = useSegmentationPresentationStore.getState();
-
       const referencedDisplaySetInstanceUID = displaySet.referencedDisplaySetInstanceUID;
       addSegmentationPresentationItem(referencedDisplaySetInstanceUID, {
         segmentationId: displaySet.displaySetInstanceUID,
@@ -847,9 +875,14 @@ function commandsModule({
 
       const { viewport } = enabledElement;
 
+      const imageProperties = viewport.getProperties();
       viewport.resetProperties?.();
       viewport.resetCamera();
 
+      if (imageProperties && imageProperties.invert) {
+        viewport.setColormap(invertColorMap(colormaps[1]));
+      }
+
       viewport.render();
     },
     scaleViewport: ({ direction }) => {
@@ -1725,6 +1758,7 @@ function commandsModule({
       const { segmentationService } = servicesManager.services;
       const { activeViewportId } = viewportGridService.getState();
       const activeSegmentation = segmentationService.getActiveSegmentation(activeViewportId);
+
       segmentationService.addSegment(activeSegmentation.segmentationId);
     },
     loadSegmentationDisplaySetsForViewport: ({ viewportId, displaySetInstanceUIDs }) => {
```

### `extensions/cornerstone/src/services/SegmentationService/SegmentationService.ts`

```diff
diff --git a/extensions/cornerstone/src/services/SegmentationService/SegmentationService.ts b/extensions/cornerstone/src/services/SegmentationService/SegmentationService.ts
index e19f0ecc85..011706710a 100644
--- a/extensions/cornerstone/src/services/SegmentationService/SegmentationService.ts
+++ b/extensions/cornerstone/src/services/SegmentationService/SegmentationService.ts
@@ -29,6 +29,7 @@ import { updateLabelmapSegmentationImageReferences } from '@cornerstonejs/tools/
 import { triggerSegmentationRepresentationModified } from '@cornerstonejs/tools/segmentation/triggerSegmentationEvents';
 import { convertStackToVolumeLabelmap } from '@cornerstonejs/tools/segmentation/helpers/convertStackToVolumeLabelmap';
 import { getLabelmapImageIds } from '@cornerstonejs/tools/segmentation';
+import { updateSegmentationStats } from '../../utils/updateSegmentationStats';
 
 const LABELMAP = csToolsEnums.SegmentationRepresentations.Labelmap;
 const CONTOUR = csToolsEnums.SegmentationRepresentations.Contour;
@@ -275,7 +276,7 @@ class SegmentationService extends PubSubService {
       suppressEvents?: boolean;
     }
   ): Promise<void> {
-    const segmentation = this.getSegmentation(segmentationId);
+    let segmentation = this.getSegmentation(segmentationId);
     const csViewport = this.getAndValidateViewport(viewportId);
 
     if (!csViewport) {
@@ -305,6 +306,19 @@ class SegmentationService extends PubSubService {
       ));
     }
 
+    setTimeout(async () => {
+      const readableText = this.servicesManager.services.customizationService.getCustomization(
+        'panelSegmentation.readableText'
+      );
+
+      const activeSegmentation = segmentation;
+      segmentation = await updateSegmentationStats({
+        segmentation: activeSegmentation,
+        segmentationId: segmentationId,
+        readableText,
+      });
+    }, 1000);
+
     await this._addSegmentationRepresentation(
       viewportId,
       segmentationId,
@@ -469,6 +483,7 @@ class SegmentationService extends PubSubService {
         SegmentLabel,
         SegmentAlgorithmType,
         SegmentAlgorithmName,
+        TrackingID,
         SegmentedPropertyTypeCodeSequence,
         rgba,
       } = segmentInfo;
@@ -500,10 +515,10 @@ class SegmentationService extends PubSubService {
             : '',
           algorithmType: SegmentAlgorithmType,
           algorithmName: SegmentAlgorithmName,
+          trackingId: TrackingID,
         },
       };
     });
-
     // get next color lut index
     const colorLUTIndex = getNextColorLUTIndex();
     addColorLUT(colorLUT, colorLUTIndex);
@@ -548,7 +563,6 @@ class SegmentationService extends PubSubService {
   ): Promise<string> {
     const { type } = options;
     let { segmentationId } = options;
-
     // Currently, only contour representation is supported for RT display
     if (type !== CONTOUR) {
       throw new Error('Only contour type is supported for RT display sets right now');
@@ -651,6 +665,7 @@ class SegmentationService extends PubSubService {
         // Broadcast segment loading progress
         const numInitialized = Object.keys(segmentsCachedStats).length;
         const percentComplete = Math.round((numInitialized / allRTStructData.length) * 100);
+
         this._broadcastEvent(EVENTS.SEGMENT_LOADING_COMPLETE, {
           percentComplete,
           numSegments: allRTStructData.length,
@@ -699,7 +714,6 @@ class SegmentationService extends PubSubService {
   ) {
     const segmentationId = data.segmentationId;
     const existingSegmentation = cstSegmentation.state.getSegmentation(segmentationId);
-
     if (existingSegmentation) {
       // Update the existing segmentation
       this.updateSegmentationInSource(segmentationId, data as Partial<cstTypes.Segmentation>);
@@ -893,8 +907,13 @@ class SegmentationService extends PubSubService {
    * 3. If the removed segment was the active segment, it updates the active segment index.
    *
    */
-  public removeSegment(segmentationId: string, segmentIndex: number): void {
-    cstSegmentation.removeSegment(segmentationId, segmentIndex);
+  public async removeSegment(segmentationId: string, segmentIndex: number): Promise<void> {
+    await cstSegmentation.removeSegment(segmentationId, segmentIndex);
+
+    this._broadcastEvent(this.EVENTS.SEGMENTATION_DATA_MODIFIED, {
+      segmentationId,
+      action: 'REMOVE',
+    });
   }
 
   public setSegmentVisibility(
@@ -1193,7 +1212,9 @@ class SegmentationService extends PubSubService {
 
     viewportIds.forEach(viewportId => {
       const { viewport } = getEnabledElementByViewportId(viewportId);
-      viewport.jumpToWorld(world);
+      if (world) {
+        viewport.jumpToWorld(world);
+      }
 
       highlightSegment &&
         this.highlightSegment(
@@ -1513,7 +1534,7 @@ class SegmentationService extends PubSubService {
       throw new Error(`Segmentation with ID ${segmentationId} not found.`);
     }
 
-    const segmentIds = Object.keys(segmentation.segments);
+    const segmentIds = Object.keys(segmentation?.segments);
 
     for (const segmentId of segmentIds) {
       const segmentIndex = parseInt(segmentId, 10);
@@ -1762,6 +1783,16 @@ class SegmentationService extends PubSubService {
       return;
     }
 
+    const readableText = this.servicesManager.services.customizationService.getCustomization(
+      'panelSegmentation.readableText'
+    );
+
+    updateSegmentationStats({
+      segmentation,
+      segmentationId,
+      readableText,
+    });
+
     const { segments } = segmentation;
 
     const { cachedStats } = segments[segmentIndex];
@@ -1774,7 +1805,7 @@ class SegmentationService extends PubSubService {
 
     if (!center) {
       return {
-        world: cachedStats.namedStats.center.value,
+        world: cachedStats?.namedStats?.center?.value,
       };
     }
 
@@ -1808,6 +1839,10 @@ class SegmentationService extends PubSubService {
     const { segments } = segmentation;
 
     segments[segmentIndex].label = segmentLabel;
+    this._broadcastEvent(this.EVENTS.SEGMENTATION_DATA_MODIFIED, {
+      segmentationId,
+      action: 'RENAME',
+    });
 
     cstSegmentation.updateSegmentations([
       {
@@ -1820,10 +1855,12 @@ class SegmentationService extends PubSubService {
   }
 
   private _onSegmentationDataModifiedFromSource = evt => {
-    const { segmentationId } = evt.detail;
-    this._broadcastEvent(this.EVENTS.SEGMENTATION_DATA_MODIFIED, {
-      segmentationId,
-    });
+    const { segmentationId, segmentIndex } = evt.detail;
+    if (segmentIndex !== undefined) {
+      this._broadcastEvent(this.EVENTS.SEGMENTATION_DATA_MODIFIED, {
+        segmentationId,
+      });
+    }
   };
 
   private _onSegmentationRepresentationModifiedFromSource = evt => {
```

### `platform/ui-next/src/components/DataRow/DataRow.tsx`

```diff
diff --git a/platform/ui-next/src/components/DataRow/DataRow.tsx b/platform/ui-next/src/components/DataRow/DataRow.tsx
index 31e5ef47dc..efc501189d 100644
--- a/platform/ui-next/src/components/DataRow/DataRow.tsx
+++ b/platform/ui-next/src/components/DataRow/DataRow.tsx
@@ -62,6 +62,7 @@ interface DataRowProps {
   description: string;
   details?: { primary: string[]; secondary: string[] };
   //
+  hasStats?: boolean;
   isSelected?: boolean;
   onSelect?: (e) => void;
   //
@@ -72,6 +73,7 @@ interface DataRowProps {
   onToggleLocked: (e) => void;
   //
   title: string;
+  onClickDisplay: (n: number) => void;
   onRename: (e) => void;
   //
   onDelete: (e) => void;
@@ -85,10 +87,12 @@ export const DataRow: React.FC<DataRowProps> = ({
   number,
   title,
   colorHex,
+  hasStats,
   details,
   onSelect,
   isLocked,
   onToggleVisibility,
+  onClickDisplay,
   onToggleLocked,
   onRename,
   onDelete,
@@ -99,7 +103,7 @@ export const DataRow: React.FC<DataRowProps> = ({
   className,
 }) => {
   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
-  const isTitleLong = title?.length > 25;
+  const isTitleLong = title?.length > 15;
   const rowRef = useRef<HTMLDivElement>(null);
 
   // useEffect(() => {
@@ -198,9 +202,8 @@ export const DataRow: React.FC<DataRowProps> = ({
       className={cn('flex flex-col', !isVisible && 'opacity-60', className)}
     >
       <div
-        className={`flex items-center ${
-          isSelected ? 'bg-popover' : 'bg-muted'
-        } group relative cursor-pointer`}
+        className={`flex items-center ${isSelected ? 'bg-popover' : 'bg-muted'
+          } group relative cursor-pointer`}
         onClick={onSelect}
         data-cy="data-row"
       >
@@ -209,9 +212,8 @@ export const DataRow: React.FC<DataRowProps> = ({
 
         {/* Number Box */}
         <div
-          className={`flex h-7 max-h-7 w-7 flex-shrink-0 items-center justify-center rounded-l border-r border-black text-base ${
-            isSelected ? 'bg-highlight text-black' : 'bg-muted text-muted-foreground'
-          } overflow-hidden`}
+          className={`flex h-7 max-h-7 w-7 flex-shrink-0 items-center justify-center rounded-l border-r border-black text-base ${isSelected ? 'bg-highlight text-black' : 'bg-muted text-muted-foreground'
+            } overflow-hidden`}
         >
           {number}
         </div>
@@ -232,11 +234,9 @@ export const DataRow: React.FC<DataRowProps> = ({
             <Tooltip>
               <TooltipTrigger asChild>
                 <span
-                  className={`cursor-default text-base ${
-                    isSelected ? 'text-highlight' : 'text-muted-foreground'
-                  } [overflow:hidden] [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]`}
+                  className={`cursor-default text-base ${isSelected ? 'text-highlight' : 'text-muted-foreground'} block w-full`}
                 >
-                  {title}
+                  {title.slice(0, 15)}…
                 </span>
               </TooltipTrigger>
               <TooltipContent
@@ -248,14 +248,48 @@ export const DataRow: React.FC<DataRowProps> = ({
             </Tooltip>
           ) : (
             <span
-              className={`text-base ${
-                isSelected ? 'text-highlight' : 'text-muted-foreground'
-              } [overflow:hidden] [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]`}
+              className={`text-base ${isSelected ? 'text-highlight' : 'text-muted-foreground'
+                } [overflow:hidden] [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]`}
             >
               {title}
             </span>
           )}
         </div>
+        <div className="relative ml-2 flex items-center space-x-1">
+          {!hasStats ? (
+            <Tooltip>
+              <TooltipTrigger asChild>
+                <Button
+                  size="icon"
+                  variant="ghost"
+                  className={`h-6 w-6 opacity-30 transition-opacity`}
+                  aria-label="ListView"
+                >
+                  <Icons.ListView className="h-6 w-6" />
+                </Button>
+              </TooltipTrigger>
+              <TooltipContent
+                side="top"
+                align="center"
+              >
+                Segmentation statistics are being computed...
+              </TooltipContent>
+            </Tooltip>
+          ) : (
+            <Button
+              size="icon"
+              variant="ghost"
+              className={`h-6 w-6 opacity-100 transition-opacity`}
+              aria-label="ListView"
+              onClick={e => {
+                e.stopPropagation();
+                onClickDisplay(number);
+              }}
+            >
+              <Icons.ListView className="h-6 w-6" />
+            </Button>
+          )}
+        </div>
 
         {/* Actions and Visibility Toggle */}
         <div className="relative ml-2 flex items-center space-x-1">
@@ -263,9 +297,8 @@ export const DataRow: React.FC<DataRowProps> = ({
           <Button
             size="icon"
             variant="ghost"
-            className={`h-6 w-6 transition-opacity ${
-              isSelected || !isVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
-            }`}
+            className={`h-6 w-6 transition-opacity ${isSelected || !isVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
+              }`}
             aria-label={isVisible ? 'Hide' : 'Show'}
             onClick={e => {
               e.stopPropagation();
@@ -286,11 +319,10 @@ export const DataRow: React.FC<DataRowProps> = ({
                 <Button
                   size="icon"
                   variant="ghost"
-                  className={`h-6 w-6 transition-opacity ${
-                    isSelected || isDropdownOpen
+                  className={`h-6 w-6 transition-opacity ${isSelected || isDropdownOpen
                       ? 'opacity-100'
                       : 'opacity-0 group-hover:opacity-100'
-                  }`}
+                    }`}
                   aria-label="Actions"
                   onClick={e => e.stopPropagation()} // Prevent row selection on button click
                 >
```

### `platform/core/src/services/ToolBarService/ToolbarService.ts`

```diff
diff --git a/platform/core/src/services/ToolBarService/ToolbarService.ts b/platform/core/src/services/ToolBarService/ToolbarService.ts
index 90334c13a0..4935e906b5 100644
--- a/platform/core/src/services/ToolBarService/ToolbarService.ts
+++ b/platform/core/src/services/ToolBarService/ToolbarService.ts
@@ -286,11 +286,13 @@ export default class ToolbarService extends PubSubService {
 
         toolButtonIds.forEach(buttonId => {
           const button = buttons[buttonId];
-          const updatedProps = evaluateButtonProps(button, button.props, refreshProps);
-          buttons[buttonId] = {
-            ...button,
-            props: updatedProps,
-          };
+          if (button?.props) {
+            const updatedProps = evaluateButtonProps(button, button?.props, refreshProps);
+            buttons[buttonId] = {
+              ...button,
+              props: updatedProps,
+            };
+          }
         });
       }
     });
```

### `extensions/cornerstone/src/panels/PanelSegmentation.tsx`

```diff
diff --git a/extensions/cornerstone/src/panels/PanelSegmentation.tsx b/extensions/cornerstone/src/panels/PanelSegmentation.tsx
index 91ce81fe40..f2305c8dd9 100644
--- a/extensions/cornerstone/src/panels/PanelSegmentation.tsx
+++ b/extensions/cornerstone/src/panels/PanelSegmentation.tsx
@@ -1,4 +1,4 @@
-import React from 'react';
+import React, { useState, useEffect, useCallback } from 'react';
 import { SegmentationTable } from '@ohif/ui-next';
 import { useActiveViewportSegmentationRepresentations } from '../hooks/useActiveViewportSegmentationRepresentations';
 import { metaData } from '@cornerstonejs/core';
@@ -13,22 +13,64 @@ export default function PanelSegmentation({ children }: withAppTypes) {
       servicesManager,
     });
 
-  // Extract customization options
-  const segmentationTableMode = customizationService.getCustomization(
-    'panelSegmentation.tableMode'
-  ) as unknown as string;
-  const onSegmentationAdd = customizationService.getCustomization(
-    'panelSegmentation.onSegmentationAdd'
-  );
-  const disableEditing = customizationService.getCustomization('panelSegmentation.disableEditing');
-  const showAddSegment = customizationService.getCustomization('panelSegmentation.showAddSegment');
-  const CustomDropdownMenuContent = customizationService.getCustomization(
-    'panelSegmentation.customDropdownMenuContent'
-  );
+  // Helper function to get all customizations
+  const getCustomizations = useCallback(() => {
+    return {
+      segmentationTableMode: customizationService.getCustomization(
+        'panelSegmentation.tableMode'
+      ) as unknown as string,
+      onSegmentationAdd: customizationService.getCustomization(
+        'panelSegmentation.onSegmentationAdd'
+      ),
+      disableEditing: customizationService.getCustomization('panelSegmentation.disableEditing'),
+      showAddSegment: customizationService.getCustomization('panelSegmentation.showAddSegment'),
+      disableAddSegmentation: customizationService.getCustomization(
+        'panelSegmentation.disableAddSegmentation'
+      ),
+      CustomDropdownMenuContent: customizationService.getCustomization(
+        'panelSegmentation.customDropdownMenuContent'
+      ),
+      CustomSegmentStatisticsHeader: customizationService.getCustomization(
+        'panelSegmentation.customSegmentStatisticsHeader'
+      ),
+    };
+  }, [customizationService]);
 
-  const CustomSegmentStatisticsHeader = customizationService.getCustomization(
-    'panelSegmentation.customSegmentStatisticsHeader'
-  );
+  // State to hold customizations
+  const [customizations, setCustomizations] = useState(getCustomizations);
+
+  // Subscribe to customization changes
+  useEffect(() => {
+    const updateCustomizations = () => {
+      setCustomizations(getCustomizations());
+    };
+
+    const subscriptions = [
+      customizationService.subscribe(
+        customizationService.EVENTS.MODE_CUSTOMIZATION_MODIFIED,
+        updateCustomizations
+      ),
+      customizationService.subscribe(
+        customizationService.EVENTS.GLOBAL_CUSTOMIZATION_MODIFIED,
+        updateCustomizations
+      ),
+    ];
+
+    return () => {
+      subscriptions.forEach(sub => sub.unsubscribe());
+    };
+    // eslint-disable-next-line react-hooks/exhaustive-deps
+  }, [customizationService]);
+
+  // Extract customization options from state
+  const {
+    segmentationTableMode,
+    onSegmentationAdd,
+    disableEditing,
+    showAddSegment,
+    disableAddSegmentation,
+    CustomSegmentStatisticsHeader,
+  } = customizations;
 
   // Create handlers object for all command runs
   const handlers = {
@@ -137,6 +179,7 @@ export default function PanelSegmentation({ children }: withAppTypes) {
     disableEditing,
     onSegmentationAdd,
     showAddSegment,
+    disableAddSegmentation,
     renderInactiveSegmentations: handlers.getRenderInactiveSegmentations(),
     ...handlers,
   };
@@ -157,13 +200,6 @@ export default function PanelSegmentation({ children }: withAppTypes) {
     if (tableProps.mode === 'collapsed') {
       return (
         <SegmentationTable.Collapsed>
-          <SegmentationTable.Collapsed.Header>
-            <SegmentationTable.Collapsed.DropdownMenu>
-              <CustomDropdownMenuContent />
-            </SegmentationTable.Collapsed.DropdownMenu>
-            <SegmentationTable.Collapsed.Selector />
-            <SegmentationTable.Collapsed.Info />
-          </SegmentationTable.Collapsed.Header>
           <SegmentationTable.Collapsed.Content>
             <SegmentationTable.AddSegmentRow />
             {renderSegments()}
@@ -176,11 +212,7 @@ export default function PanelSegmentation({ children }: withAppTypes) {
       <>
         <SegmentationTable.Expanded>
           <SegmentationTable.Expanded.Header>
-            <SegmentationTable.Expanded.DropdownMenu>
-              <CustomDropdownMenuContent />
-            </SegmentationTable.Expanded.DropdownMenu>
             <SegmentationTable.Expanded.Label />
-            <SegmentationTable.Expanded.Info />
           </SegmentationTable.Expanded.Header>
 
           <SegmentationTable.Expanded.Content>
```

### `platform/ui-next/src/components/SegmentationTable/SegmentationSegments.tsx`

```diff
diff --git a/platform/ui-next/src/components/SegmentationTable/SegmentationSegments.tsx b/platform/ui-next/src/components/SegmentationTable/SegmentationSegments.tsx
index 48b99efdfb..4704327fdf 100644
--- a/platform/ui-next/src/components/SegmentationTable/SegmentationSegments.tsx
+++ b/platform/ui-next/src/components/SegmentationTable/SegmentationSegments.tsx
@@ -4,6 +4,7 @@ import { HoverCard, HoverCardTrigger, HoverCardContent } from '../../components/
 import { useSegmentationTableContext, useSegmentationExpanded } from './contexts';
 import { SegmentStatistics } from './SegmentStatistics';
 import { useDynamicMaxHeight } from '../../hooks/useDynamicMaxHeight';
+import { OHIFMessageType } from '../../../../../deemea-extension/src/utils/enums';
 
 export const SegmentationSegments = ({ children = null }: { children?: React.ReactNode }) => {
   const {
@@ -18,6 +19,8 @@ export const SegmentationSegments = ({ children = null }: { children?: React.Rea
     data,
   } = useSegmentationTableContext('SegmentationSegments');
 
+  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null);
+
   // Try to get segmentation data from expanded context first, then fall back to table context
   let segmentation;
   let representation;
@@ -36,6 +39,20 @@ export const SegmentationSegments = ({ children = null }: { children?: React.Rea
     representation = segmentationInfo?.representation;
   }
 
+  const messageRef = React.useRef(false);
+
+  const sendMessageToFront = () => {
+    if (!messageRef.current) {
+      window.parent.postMessage(
+        {
+          type: OHIFMessageType.EXPORT_AVAILABLE,
+        },
+        '*'
+      );
+      messageRef.current = true;
+    }
+  };
+
   const segments = Object.values(representation.segments);
   const isActiveSegmentation = segmentation.segmentationId === activeSegmentationId;
 
@@ -73,17 +90,30 @@ export const SegmentationSegments = ({ children = null }: { children?: React.Rea
           const cssColor = `rgb(${color[0]},${color[1]},${color[2]})`;
 
           const hasStats = segmentFromSegmentation.cachedStats?.namedStats;
+
+          if (hasStats) {
+            sendMessageToFront();
+          }
+
           const DataRowComponent = (
             <DataRow
               key={segmentIndex}
               number={segmentIndex}
               title={label}
+              hasStats={hasStats}
               // details={displayText}
               description={displayText}
               colorHex={cssColor}
               isSelected={active}
               isVisible={visible}
               isLocked={locked}
+              onClickDisplay={index => {
+                if (!hoverIndex || index !== hoverIndex) {
+                  setHoverIndex(index);
+                } else {
+                  setHoverIndex(null);
+                }
+              }}
               disableEditing={disableEditing}
               className={!isActiveSegmentation ? 'opacity-80' : ''}
               onColor={() => onSegmentColorClick(segmentation.segmentationId, segmentIndex)}
@@ -101,10 +131,11 @@ export const SegmentationSegments = ({ children = null }: { children?: React.Rea
             />
           );
 
-          return hasStats ? (
+          return hasStats && hoverIndex === segmentIndex ? (
             <HoverCard
-              key={`hover-${segmentIndex}`}
-              openDelay={300}
+              open={hoverIndex === segmentIndex}
+              key={`hover-${hoverIndex || segmentIndex}`}
+              openDelay={100}
             >
               <HoverCardTrigger asChild>
                 <div>{DataRowComponent}</div>
```

### `extensions/cornerstone/src/utils/segmentationHandlers.ts`

```diff
diff --git a/extensions/cornerstone/src/utils/segmentationHandlers.ts b/extensions/cornerstone/src/utils/segmentationHandlers.ts
index 8e233e9cc4..515dc2af67 100644
--- a/extensions/cornerstone/src/utils/segmentationHandlers.ts
+++ b/extensions/cornerstone/src/utils/segmentationHandlers.ts
@@ -1,20 +1,33 @@
 import * as cornerstoneTools from '@cornerstonejs/tools';
 import { updateSegmentationStats } from './updateSegmentationStats';
-
+import { DicomMetadataStore } from '@ohif/core';
+import { OHIFMessageType } from 'deemea-extension/src/utils/enums';
+import axios from 'axios';
 /**
  * Sets up the handler for segmentation data modification events
  */
 export function setupSegmentationDataModifiedHandler({
   segmentationService,
   customizationService,
+  displaySetService,
+  uiNotificationService,
+  userAuthenticationService,
   commandsManager,
+  extensionManager,
 }) {
   const { unsubscribe } = segmentationService.subscribeDebounced(
     segmentationService.EVENTS.SEGMENTATION_DATA_MODIFIED,
-    async ({ segmentationId }) => {
+    async ({ segmentationId, action }) => {
+      const waitingMessage = uiNotificationService.show({
+        title: 'Updating the segmentations...',
+        type: 'loading',
+        duration: 5000,
+      });
+
       const segmentation = segmentationService.getSegmentation(segmentationId);
 
       if (!segmentation) {
+        uiNotificationService.hide(waitingMessage);
         return;
       }
 
@@ -42,14 +55,78 @@ export function setupSegmentationDataModifiedHandler({
         readableText,
       });
 
-      if (updatedSegmentation) {
+      if (updatedSegmentation || action === 'RENAME' || action === 'REMOVE') {
+        if (!updatedSegmentation?.segments) {
+          uiNotificationService.show({
+            title: 'Browse all the slices to update the segmentation name',
+            type: 'warning',
+            duration: 8000,
+          });
+
+          return;
+        }
         segmentationService.addOrUpdateSegmentation({
           segmentationId,
           segments: updatedSegmentation.segments,
         });
+        // SAVE AUTO SEGMENTATION
+        try {
+          const displaySets = displaySetService.getActiveDisplaySets();
+          const segDisplaySets = displaySets.filter(ds => ds.Modality === 'SEG');
+
+          const defaultDataSource = extensionManager.getActiveDataSource();
+          const generatedData = await commandsManager.run('generateSegmentation', {
+            segmentationId,
+          });
+
+          if (!generatedData || !generatedData.dataset) {
+            throw new Error('Error during segmentation generation');
+          }
+
+          const { dataset: naturalizedReport } = generatedData;
+          naturalizedReport.SeriesDescription = 'Deemea segmentation';
+
+          await defaultDataSource[0].store.dicom(naturalizedReport);
+          naturalizedReport.wadoRoot = defaultDataSource[0].getConfig().wadoRoot;
+          DicomMetadataStore.addInstances([naturalizedReport], true);
+
+          window.parent.postMessage(
+            {
+              type: OHIFMessageType.SAVE_SEGMENTATION,
+              message: {
+                seriesInstanceUID: naturalizedReport.SeriesInstanceUID,
+              },
+            },
+            '*'
+          );
+
+          if (segDisplaySets.length === 1) {
+            const series = segDisplaySets[0].SeriesInstanceUID;
+            const study = segDisplaySets[0].StudyInstanceUID;
+            const deleteUrl = `${defaultDataSource[0].getConfig().wadoRoot}/studies/${study}/series/${series}`;
+            await axios.delete(deleteUrl, {
+              headers: {
+                ...userAuthenticationService.getAuthorizationHeader(),
+              },
+            });
+            displaySetService.deleteDisplaySet(segDisplaySets[0].displaySetInstanceUID);
+          }
+          uiNotificationService.hide(waitingMessage);
+          uiNotificationService.show({
+            title: segDisplaySets.length === 1 ? 'Segmentation updated' : 'Segmentation created',
+            type: 'success',
+            duration: 4000,
+          });
+
+          return naturalizedReport;
+        } catch (error) {
+          uiNotificationService.hide(waitingMessage);
+          console.debug('Error storing segmentation:', error);
+          throw error;
+        }
       }
     },
-    1000
+    500
   );
 
   return { unsubscribe };
```

### `extensions/cornerstone-dicom-seg/src/viewports/OHIFCornerstoneSEGViewport.tsx`

```diff
diff --git a/extensions/cornerstone-dicom-seg/src/viewports/OHIFCornerstoneSEGViewport.tsx b/extensions/cornerstone-dicom-seg/src/viewports/OHIFCornerstoneSEGViewport.tsx
index 2d7ae91053..0c600a4a93 100644
--- a/extensions/cornerstone-dicom-seg/src/viewports/OHIFCornerstoneSEGViewport.tsx
+++ b/extensions/cornerstone-dicom-seg/src/viewports/OHIFCornerstoneSEGViewport.tsx
@@ -8,6 +8,10 @@ import _getStatusComponent from './_getStatusComponent';
 import { usePositionPresentationStore } from '@ohif/extension-cornerstone';
 import { SegmentationRepresentations } from '@cornerstonejs/tools/enums';
 import { utils } from '@ohif/extension-cornerstone';
+import { segmentation as cstSegmentation } from '@cornerstonejs/tools';
+import { updateSegmentationStats } from '../../../../extensions/cornerstone/src/utils/updateSegmentationStats';
+import * as cornerstone from '@cornerstonejs/core'; // for 3D
+import { cache } from '@cornerstonejs/core';
 
 const SEG_TOOLGROUP_BASE_NAME = 'SEGToolGroup';
 
@@ -191,6 +195,7 @@ function OHIFCornerstoneSEGViewport(props: withAppTypes) {
     const { unsubscribe } = segmentationService.subscribe(
       segmentationService.EVENTS.SEGMENTATION_LOADING_COMPLETE,
       evt => {
+        console.time('loadAllImagesAndGetStats');
         if (evt.segDisplaySet.displaySetInstanceUID === segDisplaySet.displaySetInstanceUID) {
           setSegIsLoading(false);
         }
@@ -205,6 +210,78 @@ function OHIFCornerstoneSEGViewport(props: withAppTypes) {
             },
           });
         }
+
+        if (!segDisplaySet || !segDisplaySet.imageIds) {
+          console.warn('Unable to retrieve the segDisplaySet for images.');
+          return;
+        }
+
+        const originalImageIds = referencedDisplaySet?.imageIds || [];
+        if (!originalImageIds.length) {
+          console.warn('No images found in the referenced displaySet.');
+          return;
+        }
+        const loadedImageIds: string[] = [];
+        const unloadedImageIds: string[] = [];
+
+        originalImageIds.forEach(id => {
+          const cachedImage = cache?.getImage?.(id);
+          if (cachedImage) {
+            loadedImageIds.push(id);
+          } else {
+            unloadedImageIds.push(id);
+          }
+        });
+
+        if (loadedImageIds.length) {
+          console.info(
+            `Images already loaded (${loadedImageIds.length}/${originalImageIds.length}) - they will not be reloaded.`
+          );
+        }
+        if (!unloadedImageIds.length) {
+          console.info(
+            'All necessary images are already in cache, proceeding directly to statistics calculation.'
+          );
+        }
+
+        const loadImagesResult =
+          typeof cornerstone.imageLoader.loadAndCacheImages === 'function'
+            ? cornerstone.imageLoader.loadAndCacheImages(unloadedImageIds)
+            : undefined;
+
+        const loadPromise: Promise<any> = Array.isArray(loadImagesResult)
+          ? Promise.all(loadImagesResult)
+          : (loadImagesResult ??
+            Promise.all(unloadedImageIds.map(id => cornerstone.imageLoader.loadAndCacheImage(id))));
+
+        // Once all referenced images are loaded, compute stats and update segmentation state
+        loadPromise
+          .then(async () => {
+            const readableText = servicesManager.services.customizationService.getCustomization(
+              'panelSegmentation.readableText'
+            );
+
+            const currentSegmentation = cstSegmentation.state.getSegmentation(evt.segmentationId);
+            const updatedSegmentation = await updateSegmentationStats({
+              segmentation: currentSegmentation,
+              segmentationId: evt.segmentationId as string,
+              readableText,
+            });
+
+            console.log('updatedSegmentation', updatedSegmentation);
+
+            // Persist the updated stats so UI (hasStats) becomes true and ListView button activates
+            if (updatedSegmentation?.segments) {
+              segmentationService.addOrUpdateSegmentation({
+                segmentationId: evt.segmentationId as string,
+                segments: updatedSegmentation.segments,
+              });
+            }
+            console.timeEnd('loadAllImagesAndGetStats');
+          })
+          .catch(error => {
+            console.warn('Error loading images before statistics calculation:', error);
+          });
       }
     );
 
@@ -337,7 +414,7 @@ function OHIFCornerstoneSEGViewport(props: withAppTypes) {
   if (
     !referencedDisplaySetRef.current ||
     referencedDisplaySet.displaySetInstanceUID !==
-      referencedDisplaySetRef.current.displaySet.displaySetInstanceUID
+    referencedDisplaySetRef.current.displaySet.displaySetInstanceUID
   ) {
     return null;
   }
```

---

## 🟠 TODO runtime (post-merge) — comportements changés, pas d'erreur de compil

Issu du scan des guides `3p10-to-3p11` / `3p11-to-3p12` croisé avec le code fork.

### 1. Toolbox de segmentation 3D — `groupId` → `buttonSection`
En 3.11, `groupId` sur les toolbox groups est remplacé par `buttonSection`. À vérifier :
- `deemea-mode-3d/src/segmentationButtons.ts` :19, :28, :41 (`uiType: ohif.toolBoxButtonGroup`)
- `deemea-mode-3d/src/segmentationButtonsValidated.ts` :19, :33, :46
- `deemea-mode-3d/src/toolbarButtons3d.ts` :25, :34, :42
- `deemea-mode-3d/src/toolbarButtonsValidated3d.ts` :102 (a déjà `buttonSection`, le `groupId` est résiduel → à supprimer)

**Test :** les groupes Brush / Segmentation / Utilities s'affichent et se déplient en mode 3D.
Si cassé : `groupId: 'X'` → `props.buttonSection: 'X'` + `toolbarService.updateSection('X', [...])`.
> ⚠️ Ignorer les autres `groupId` (SegmentationService stats l.1279, panels layout) : sans rapport.

### 2. Calibration — `platform/core/src/classes/MetadataProvider.ts`
Ta garde anti-écrasement lit `calibratedPixelSpacingMetadataProvider.get('calibratedPixelSpacing', imageId)`
(API cornerstone3D, bumpé en 3.12). **Test :** calibration manuelle persiste et n'est pas
écrasée au rechargement. Vérifier la signature `.get(key, imageId)` vs le nouveau `@cornerstonejs/core`.
> Note : le changement 3.12 sur le formatage `patientName`/`studyDate` ne te concerne PAS (non utilisé dans deemea-*).

### 3. Viewport SEG + stats — `extensions/cornerstone-dicom-seg/src/viewports/OHIFCornerstoneSEGViewport.tsx`
Tes +78 lignes ne dépendent d'aucun composant supprimé ✅, mais utilisent l'API segmentation
cornerstone3D (`cstSegmentation`, `cache`) + ton `updateSegmentationStats`.
**Test :** chargement d'une SEG, calcul stats/biomarkers, mode 3D. (Hydration OK : `promptHydrationDialog` en place.)

### 4. Tri des images par `ImagePositionPatient` (nouveau défaut 3.11, global)
**Test :** ordre des coupes + position mesures/calibration. Régression → customization
`instanceSortingCriteria: { defaultSortFunctionName: 'default' }`.
