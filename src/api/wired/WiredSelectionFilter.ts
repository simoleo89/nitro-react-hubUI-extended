import { ColorConverter, NitroFilter } from '@nitrots/nitro-renderer';
import { defaultFilterVert, GlProgram, UniformGroup } from 'pixi.js';

// Migrated to the PixiJS 8 Filter API (Nitro_Render_V3 2.1.0). PixiJS 8 removed
// the v7 `new Filter(vert, frag, uniforms)` + `this.uniforms` shape: a filter now
// takes a GlProgram and exposes uniforms through a UniformGroup resource, read via
// `this.resources.<group>.uniforms`. The fragment shader is GLSL ES 3.00
// (in/out/texture/uTexture) and the vertex reuses Pixi's defaultFilterVert.
const fragment = `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform vec3 lineColor;
uniform vec3 color;

void main(void)
{
    vec4 currentColor = texture(uTexture, vTextureCoord);
    vec3 colorLine = lineColor * currentColor.a;
    vec3 colorOverlay = color * currentColor.a;

    if(currentColor.r == 0.0 && currentColor.g == 0.0 && currentColor.b == 0.0 && currentColor.a > 0.0)
    {
        finalColor = vec4(colorLine.r, colorLine.g, colorLine.b, currentColor.a);
    }
    else if(currentColor.a > 0.0)
    {
        finalColor = vec4(colorOverlay.r, colorOverlay.g, colorOverlay.b, currentColor.a);
    }
    else
    {
        finalColor = currentColor;
    }
}`;

export class WiredSelectionFilter extends NitroFilter
{
    private _lineColor: number;
    private _color: number;

    constructor(lineColor: number | number[], color: number | number[])
    {
        super({
            glProgram: GlProgram.from({
                vertex: defaultFilterVert,
                fragment,
                name: 'wired-selection-filter'
            }),
            resources: {
                wiredSelectionUniforms: new UniformGroup({
                    lineColor: { value: new Float32Array(3), type: 'vec3<f32>' },
                    color: { value: new Float32Array(3), type: 'vec3<f32>' }
                })
            }
        });

        this.lineColor = lineColor;
        this.color = color;
    }

    private get uniformValues(): { lineColor: Float32Array; color: Float32Array }
    {
        return (this.resources as any).wiredSelectionUniforms.uniforms;
    }

    public get lineColor(): number | number[]
    {
        return this._lineColor;
    }

    public set lineColor(value: number | number[])
    {
        const arr = this.uniformValues.lineColor;

        if(typeof value === 'number')
        {
            ColorConverter.hex2rgb(value, arr);

            this._lineColor = value;
        }
        else
        {
            arr[0] = value[0];
            arr[1] = value[1];
            arr[2] = value[2];

            this._lineColor = ColorConverter.rgb2hex(arr);
        }
    }

    public get color(): number | number[]
    {
        return this._color;
    }

    public set color(value: number | number[])
    {
        const arr = this.uniformValues.color;

        if(typeof value === 'number')
        {
            ColorConverter.hex2rgb(value, arr);

            this._color = value;
        }
        else
        {
            arr[0] = value[0];
            arr[1] = value[1];
            arr[2] = value[2];

            this._color = ColorConverter.rgb2hex(arr);
        }
    }
}
