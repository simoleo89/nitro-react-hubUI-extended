import { GetConfiguration as GetRendererConfiguration } from '@nitrots/nitro-renderer';

// Keeps this client's GetConfiguration<T>(key, default) signature, delegating to
// the renderer's configuration manager (the old static NitroConfiguration is gone).
export function GetConfiguration<T>(key: string, value: T = null): T
{
    return GetRendererConfiguration().getValue<T>(key, value);
}
