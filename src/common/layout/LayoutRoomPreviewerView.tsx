import { GetRenderer, GetTicker, NitroLogger, NitroTicker, RoomPreviewer, TextureUtils } from '@nitrots/nitro-renderer';
import { FC, MouseEvent, ReactNode, useEffect, useRef } from 'react';

export interface LayoutRoomPreviewerViewProps
{
    roomPreviewer: RoomPreviewer;
    fullHeight?: boolean;
    height?: number;
    children?: ReactNode;
}

// PixiJS 8 (Nitro_Render_V3 2.1.0): the old `TextureUtils.generateImageUrl(master)`
// no longer paints the previewer. The display container must be rendered into a
// render texture every frame, then extracted to a canvas/data-URL. Logic mirrors
// Nitro-V3's LayoutRoomPreviewerView; markup/props (fullHeight/height/children)
// kept as hubUI had them.
export const LayoutRoomPreviewerView: FC<LayoutRoomPreviewerViewProps> = props =>
{
    const { roomPreviewer = null, fullHeight = false, height = 0, children = null } = props;
    const elementRef = useRef<HTMLDivElement>(null);
    const renderFailuresRef = useRef(0);
    const MAX_RENDER_FAILURES = 6;

    const onClick = (event: MouseEvent<HTMLDivElement>) =>
    {
        if(!roomPreviewer) return;

        if(event.shiftKey) roomPreviewer.changeRoomObjectDirection();
        else roomPreviewer.changeRoomObjectState();
    };

    useEffect(() =>
    {
        if(!roomPreviewer || !elementRef.current) return;

        renderFailuresRef.current = 0;

        const measure = () =>
        {
            const element = elementRef.current;

            if(!element) return { width: 1, targetHeight: 1 };

            const width = element.clientWidth || element.parentElement?.clientWidth || 0;
            const targetHeight = fullHeight ? (element.clientHeight || element.parentElement?.clientHeight || height) : height;

            return { width: Math.max(1, width), targetHeight: Math.max(1, targetHeight) };
        };

        const { width, targetHeight } = measure();
        const texture = TextureUtils.createRenderTexture(width, targetHeight);

        const noteFailure = (label: string, error: unknown) =>
        {
            renderFailuresRef.current += 1;

            if(renderFailuresRef.current >= MAX_RENDER_FAILURES) NitroLogger.error(`LayoutRoomPreviewerView ${ label } failed ${ renderFailuresRef.current } times; disabling further renders for this preview`, error);
        };

        const paintToDOM = () =>
        {
            if(renderFailuresRef.current >= MAX_RENDER_FAILURES) return;
            if(!roomPreviewer || !elementRef.current) return;

            const renderingCanvas = roomPreviewer.getRenderingCanvas();

            if(!renderingCanvas) return;

            try
            {
                GetRenderer().render({
                    target: texture,
                    container: renderingCanvas.master,
                    clear: true
                });

                const canvas = GetRenderer().texture.generateCanvas(texture);
                const base64 = canvas.toDataURL('image/png');

                canvas.width = 0;
                canvas.height = 0;

                elementRef.current.style.backgroundImage = `url(${ base64 })`;
                renderFailuresRef.current = 0;
            }
            catch(error)
            {
                noteFailure('paint', error);
            }
        };

        const update = (ticker: NitroTicker) =>
        {
            if(renderFailuresRef.current >= MAX_RENDER_FAILURES) return;
            if(!roomPreviewer || !elementRef.current) return;

            try
            {
                roomPreviewer.updatePreviewRoomView();
            }
            catch(error)
            {
                noteFailure('update', error);
                return;
            }

            const renderingCanvas = roomPreviewer.getRenderingCanvas();

            if(renderingCanvas && renderingCanvas.canvasUpdated) paintToDOM();
        };

        roomPreviewer.getRoomCanvas(width, targetHeight);

        GetTicker().add(update);

        const resizeObserver = new ResizeObserver(() =>
        {
            if(!roomPreviewer || !elementRef.current) return;

            const next = measure();

            roomPreviewer.modifyRoomCanvas(next.width, next.targetHeight);

            paintToDOM();
        });

        resizeObserver.observe(elementRef.current);

        return () =>
        {
            GetTicker().remove(update);

            resizeObserver.disconnect();

            try
            {
                texture.destroy(true);
            }
            catch
            { }
        };
    }, [ roomPreviewer, elementRef, height, fullHeight ]);

    return (
        <div className="room-preview-container">
            <div ref={ elementRef } className="room-preview-image" onClick={ onClick } />
            { children }
        </div>
    );
};
