import { GetAssetManager, GetAvatarRenderManager, GetCommunication, GetConfiguration, GetLocalizationManager, GetRoomEngine, GetRoomSessionManager, GetSessionDataManager, GetSoundManager, GetStage, GetTexturePool, GetTicker, NitroLogger, NitroVersion, PrepareRenderer } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { GetUIVersion } from './api';
import { Base, TransitionAnimation, TransitionAnimationTypes } from './common';
import { LoadingView } from './components/loading/LoadingView';
import { LoginView } from './components/login/LoginView';
import { MainView } from './components/main/MainView';

NitroVersion.UI_VERSION = GetUIVersion();

const asStringArray = (value: unknown): string[] =>
{
    if(Array.isArray(value)) return value.filter(item => typeof item === 'string');
    if(typeof value === 'string' && value.length) return [ value ];

    return [];
};

// Bootstrap rewritten for Nitro_Render_V3 (2.1.0). The old monolithic
// `Nitro.bootstrap()` + event-chain is gone; managers are initialized
// imperatively (config -> renderer -> localization -> assets -> managers ->
// tickers -> communication). A login gate (ported from Nitro-V3) shows the
// login screen when there is no SSO ticket, then runs the boot flow on auth.
export const App: FC<{}> = props =>
{
    const [ isReady, setIsReady ] = useState(false);
    const [ isError, setIsError ] = useState(false);
    const [ message, setMessage ] = useState('Getting Ready');
    const [ percent, setPercent ] = useState(0);
    const [ imageRendering, setImageRendering ] = useState<boolean>(true);
    const [ showLogin, setShowLogin ] = useState(false);
    const [ isEntering, setIsEntering ] = useState(false);
    const [ prepareTrigger, setPrepareTrigger ] = useState(0);
    const bootRef = useRef(false);
    const lastTriggerRef = useRef(-1);

    // Initial gate: load configuration, then decide between the login screen and
    // entering the hotel (SSO ticket already present in NitroConfig / URL).
    useEffect(() =>
    {
        if(bootRef.current) return;
        bootRef.current = true;

        (async () =>
        {
            try
            {
                if(!(window as any).NitroConfig) throw new Error('NitroConfig is not defined!');

                await GetConfiguration().init();

                const ssoTicket = (window as any).NitroConfig?.['sso.ticket'];

                if(ssoTicket)
                {
                    setIsEntering(true);
                    setPrepareTrigger(1);
                }
                else
                {
                    setShowLogin(true);
                }
            }
            catch(err)
            {
                NitroLogger.error('[App] Configuration init failed', err);
                setIsError(true);
                setMessage(String((err as Error)?.message ?? 'Configuration failed'));
            }
        })();
    }, []);

    const handleAuthenticated = useCallback((ssoTicket: string) =>
    {
        if(!ssoTicket) return;

        try
        {
            (window as any).NitroConfig['sso.ticket'] = ssoTicket;
            GetConfiguration().setValue('sso.ticket', ssoTicket);
        }
        catch
        { }

        setShowLogin(false);
        setIsEntering(true);
        setPrepareTrigger(prev => prev + 1);
    }, []);

    // Boot flow — runs once the gate decides to enter (SSO present or post-login).
    useEffect(() =>
    {
        if(prepareTrigger === 0) return;
        if(lastTriggerRef.current === prepareTrigger) return;
        lastTriggerRef.current = prepareTrigger;

        const prepare = async () =>
        {
            try
            {
                setMessage('Getting Ready');

                await GetConfiguration().init();
                setPercent(15);

                GetTicker().maxFPS = GetConfiguration().getValue<number>('system.fps.max', 24);
                NitroLogger.LOG_DEBUG = GetConfiguration().getValue<boolean>('system.log.debug', false);

                const width = Math.max(1, Math.floor(window.innerWidth));
                const height = Math.max(1, Math.floor(window.innerHeight));

                const renderer = await PrepareRenderer({
                    width,
                    height,
                    resolution: window.devicePixelRatio,
                    autoDensity: true,
                    backgroundAlpha: 0,
                    preference: 'webgl',
                    eventMode: 'none',
                    failIfMajorPerformanceCaveat: false,
                    roundPixels: true
                });
                setPercent(30);

                const interpolate = (value: string) => GetConfiguration().interpolate(value);
                const assetUrls = asStringArray(GetConfiguration().getValue<unknown>('preload.assets.urls')).map(interpolate);

                await GetLocalizationManager().init();
                setPercent(45);

                const status = await GetAssetManager().downloadAssets(assetUrls);
                if(!status) throw new Error('Assets failed to download');
                setPercent(55);

                await GetAvatarRenderManager().init();
                await GetSoundManager().init();
                setPercent(65);

                await GetSessionDataManager().init();
                setPercent(75);
                await GetRoomSessionManager().init();
                setPercent(82);
                await GetRoomEngine().init();
                setPercent(90);

                GetTicker().add(ticker => GetRoomEngine().update(ticker));
                GetTicker().add(() => renderer.render(GetStage()));
                GetTicker().add(() => GetTexturePool().run());

                await GetCommunication().init();
                setPercent(100);

                setTimeout(() => setIsReady(true), 300);
            }
            catch(err)
            {
                NitroLogger.error('[App] Initialization failed', err);
                setIsError(true);
                setIsEntering(false);
                setShowLogin(false);
                setMessage(String((err as Error)?.message ?? 'Initialization failed'));
            }
        };

        prepare();
    }, [ prepareTrigger ]);

    useEffect(() =>
    {
        const resize = () => setImageRendering(!(window.devicePixelRatio % 1));

        window.addEventListener('resize', resize);

        resize();

        return () => window.removeEventListener('resize', resize);
    }, []);

    return (
        <Base fit overflow="hidden" className={ imageRendering ? 'image-rendering-pixelated' : '' }>
            { showLogin && !isReady &&
                <LoginView onAuthenticated={ handleAuthenticated } isEntering={ isEntering } /> }
            { !showLogin && !isReady &&
                <LoadingView isError={ isError } message={ message } percent={ percent } /> }
            <TransitionAnimation type={ TransitionAnimationTypes.FADE_IN } inProp={ isReady }>
                <MainView />
            </TransitionAnimation>
            <Base id="draggable-windows-container" />
        </Base>
    );
};
