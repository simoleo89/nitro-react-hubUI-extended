import { IGetImageListener, ImageResult, TextureUtils, Vector3d } from '@nitrots/nitro-renderer';
import { CSSProperties, FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BaseProps } from '..';
import { GetRoomEngine, ProductTypeEnum } from '../../api';
import { Base } from '../Base';

interface LayoutFurniImageViewProps extends BaseProps<HTMLDivElement>
{
    productType: string;
    productClassId: number;
    direction?: number;
    extraData?: string;
    scale?: number;
}

// PixiJS 8 (Nitro_Render_V3 2.1.0): TextureUtils.generateImage is async and
// ImageResult/imageReady now expose the texture via `.data` (the old getImage()
// + image.onload path silently produced nothing). Mirrors Nitro-V3.
export const LayoutFurniImageView: FC<LayoutFurniImageViewProps> = props =>
{
    const { productType = 's', productClassId = -1, direction = 2, extraData = '', scale = 1, style = {}, ...rest } = props;
    const [ imageElement, setImageElement ] = useState<HTMLImageElement>(null);
    const isMounted = useRef(true);
    const requestIdRef = useRef(0);

    useEffect(() =>
    {
        isMounted.current = true;

        return () =>
        {
            isMounted.current = false;
        };
    }, []);

    const updateImage = useCallback(async (texture: any, requestId: number) =>
    {
        if(!texture) return;

        const image = await TextureUtils.generateImage(texture);

        if(image && isMounted.current && (requestIdRef.current === requestId)) setImageElement(image);
    }, []);

    const getStyle = useMemo(() =>
    {
        let newStyle: CSSProperties = {};

        if(imageElement?.src?.length)
        {
            newStyle.backgroundImage = `url('${ imageElement.src }')`;
            newStyle.width = imageElement.width;
            newStyle.height = imageElement.height;
        }

        if(scale !== 1)
        {
            newStyle.transform = `scale(${ scale })`;

            if(!(scale % 1)) newStyle.imageRendering = 'pixelated';
        }

        if(Object.keys(style).length) newStyle = { ...newStyle, ...style };

        return newStyle;
    }, [ imageElement, scale, style ]);

    useEffect(() =>
    {
        const requestId = ++requestIdRef.current;

        setImageElement(null);

        let imageResult: ImageResult = null;

        const listener: IGetImageListener = {
            imageReady: (result: any) => updateImage(result?.data, requestId),
            imageFailed: null
        };

        switch(productType.toLocaleLowerCase())
        {
            case ProductTypeEnum.FLOOR:
                imageResult = GetRoomEngine().getFurnitureFloorImage(productClassId, new Vector3d(direction), 64, listener, 0, extraData);
                break;
            case ProductTypeEnum.WALL:
                imageResult = GetRoomEngine().getFurnitureWallImage(productClassId, new Vector3d(direction), 64, listener, 0, extraData);
                break;
        }

        if((imageResult as any)?.data) updateImage((imageResult as any).data, requestId);
    }, [ productType, productClassId, direction, extraData, updateImage ]);

    return <Base classNames={ [ 'furni-image' ] } style={ getStyle } { ...rest } />;
};
