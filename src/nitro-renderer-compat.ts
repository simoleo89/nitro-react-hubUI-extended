// Compatibility umbrella for Nitro_Render_V3 (2.1.0).
//
// The bulk of this client imports everything from '@nitrots/nitro-renderer'.
// 2.1.0 keeps ~97% of the 1.6.6 public names, so we re-export the real renderer
// wholesale and only add back the handful of helpers/classes it dropped. The
// Vite alias points '@nitrots/nitro-renderer' here and '@nitrots/nitro-renderer-real'
// at the actual renderer source, so consumers need no changes.
export * from '@nitrots/nitro-renderer-real';

// Helpers that moved out of the renderer into client space (Nitro-V3 keeps them
// under src/api/utils too).
export { FriendlyTime } from './api/utils/FriendlyTime';
export { FixedSizeStack } from './api/utils/FixedSizeStack';

// Filter the old renderer re-exported; now comes straight from pixi-filters 6.
export { AdjustmentFilter } from 'pixi-filters';

import { Container, Point } from 'pixi.js';

// NitroPoint was a thin wrapper over PixiJS Point — map it 1:1 onto PixiJS 8.
export { Point as NitroPoint };
export type INitroPoint = Point;
export const POINT_STRUCT_SIZE = 8;

// Interaction event payload type (old PixiInteractionEventProxy). Kept as a
// runtime-present class so value-position imports resolve under isolatedModules.
export class PixiInteractionEventProxy {}

// --- Floorplan editor compatibility stubs --------------------------------
// 1.6.6's floorplan editor extended PixiApplicationProxy and rendered tiles via
// a custom NitroTilemap. 2.1.0 has neither (Nitro-V3 rewrote the editor as a
// canvas + reducer). These stubs let the module compile and load; the floorplan
// editor needs a real PixiJS 8 rewrite before it functions again — out of scope
// for the build/login milestone.
export class NitroTilemap extends Container
{
    constructor(..._args: any[])
    {
        super();
    }
}

export class PixiApplicationProxy
{
    constructor(..._args: any[])
    {
    }
}
