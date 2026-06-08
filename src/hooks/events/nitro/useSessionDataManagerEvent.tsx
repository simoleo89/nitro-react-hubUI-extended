import { GetEventDispatcher, NitroEvent } from '@nitrots/nitro-renderer';
import { useEventDispatcher } from '../useEventDispatcher';

// Nitro_Render_V3 2.1.0 routes all events through the single global dispatcher.
export const useSessionDataManagerEvent = <T extends NitroEvent>(type: string | string[], handler: (event: T) => void) => useEventDispatcher(type, GetEventDispatcher(), handler);
