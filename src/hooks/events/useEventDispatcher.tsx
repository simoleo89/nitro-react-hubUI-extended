import { GetEventDispatcher, IEventDispatcher, NitroEvent } from '@nitrots/nitro-renderer';
import { useEffect } from 'react';

export const useEventDispatcher = <T extends NitroEvent>(type: string | string[], eventDispatcher: IEventDispatcher, handler: (event: T) => void, enabled: boolean = true) =>
{
    useEffect(() =>
    {
        if(!enabled) return;

        // Nitro_Render_V3 (2.1.0) routes ALL events through a single global
        // dispatcher; the old per-manager `.events` getters are gone (they
        // resolve to undefined). Fall back to the global bus when the caller's
        // dispatcher is missing so the legacy wrapper hooks keep working.
        const dispatcher = eventDispatcher ?? GetEventDispatcher();

        if(!dispatcher) return;

        if(Array.isArray(type))
        {
            type.map(name => dispatcher.addEventListener(name, handler));
        }
        else
        {
            dispatcher.addEventListener(type, handler);
        }

        return () =>
        {
            if(Array.isArray(type))
            {
                type.map(name => dispatcher.removeEventListener(name, handler));
            }
            else
            {
                dispatcher.removeEventListener(type, handler);
            }
        }
    }, [ type, eventDispatcher, enabled, handler ]);
}
