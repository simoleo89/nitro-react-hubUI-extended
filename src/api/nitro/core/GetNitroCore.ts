import { GetConfigurationManager } from './GetConfigurationManager';

// The 2.1.0 renderer dropped the INitroCore aggregate; the only member this
// client used was `core.configuration`, so expose a minimal compatible object.
export function GetNitroCore(): any
{
    return { configuration: GetConfigurationManager() };
}
