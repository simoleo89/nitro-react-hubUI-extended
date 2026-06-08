import { GetCommunication } from './GetCommunication';

export function GetConnection(): any
{
    return GetCommunication()?.connection ?? null;
}
