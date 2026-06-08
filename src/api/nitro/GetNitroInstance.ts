import { AddLinkEventTracker, CreateLinkEvent, GetAvatarRenderManager, GetConfiguration, GetEventDispatcher, GetLocalizationManager, GetRenderer, GetRoomCameraWidgetManager, GetRoomEngine, GetRoomSessionManager, GetSessionDataManager, GetSoundManager, GetStage, RemoveLinkEventTracker } from '@nitrots/nitro-renderer';

// Compatibility shim. Nitro_Render_V3 (2.1.0) removed the monolithic `Nitro`
// singleton in favour of standalone Get*() accessors. This client still calls
// GetNitroInstance().<member> in ~30 places, so we keep that facade and delegate
// every member to the new accessor. Getters stay lazy so each access resolves
// the live manager (which only exists after the App bootstrap has run).
const instance: any = {
    get roomEngine() { return GetRoomEngine(); },
    get soundManager() { return GetSoundManager(); },
    get sessionDataManager() { return GetSessionDataManager(); },
    get roomSessionManager() { return GetRoomSessionManager(); },
    get cameraManager() { return GetRoomCameraWidgetManager(); },
    get avatar() { return GetAvatarRenderManager(); },
    get localization() { return GetLocalizationManager(); },
    get events() { return GetEventDispatcher(); },
    get core() { return { configuration: GetConfiguration() }; },
    get application() { return { renderer: GetRenderer(), stage: GetStage() }; },
    get width() { return GetRenderer()?.width ?? 0; },
    get height() { return GetRenderer()?.height ?? 0; },
    getConfiguration<T>(key: string, value: T = null): T { return GetConfiguration().getValue<T>(key, value); },
    getLocalizationWithParameters(key: string, parameters: string[] = null, values: string[] = null): string { return GetLocalizationManager().getValueWithParameters(key, parameters, values); },
    createLinkEvent(link: string) { return CreateLinkEvent(link); },
    addLinkEventTracker(tracker: any) { return AddLinkEventTracker(tracker); },
    removeLinkEventTracker(tracker: any) { return RemoveLinkEventTracker(tracker); },
    init() { /* no-op: initialization is handled by the App bootstrap flow */ }
};

export function GetNitroInstance(): any
{
    return instance;
}
