/**
 * Copyright (c) 2019 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */

import { Renderable, RenderableState, createRenderable } from '../renderable'
import { WebGLContext } from '../webgl/context';
import { createGraphicsRenderItem } from '../webgl/render-item';
import { GlobalUniformSchema, BaseSchema, DefineSpec, Values, InternalSchema, InternalValues, UniformSpec, TextureSpec } from './schema';
import { MeshShaderCode } from '../shader-code';
import { ValueCell } from 'mol-util';

export const IsosurfaceSchema = {
    ...BaseSchema,

    uGeoTexDim: UniformSpec('v2'),
    /** texture has vertex positions in XYZ and group id in W */
    tPositionGroup: TextureSpec('texture', 'rgba', 'float', 'nearest'),
    tNormal: TextureSpec('texture', 'rgba', 'float', 'nearest'),

    dFlatShaded: DefineSpec('boolean'),
    dDoubleSided: DefineSpec('boolean'),
    dFlipSided: DefineSpec('boolean'),
    dGeoTexture: DefineSpec('boolean'),
}
export type IsosurfaceSchema = typeof IsosurfaceSchema
export type IsosurfaceValues = Values<IsosurfaceSchema>

export function IsosurfaceRenderable(ctx: WebGLContext, id: number, values: IsosurfaceValues, state: RenderableState, materialId: number): Renderable<IsosurfaceValues> {
    const schema = { ...GlobalUniformSchema, ...InternalSchema, ...IsosurfaceSchema }
    const internalValues: InternalValues = {
        uObjectId: ValueCell.create(id),
        uPickable: ValueCell.create(state.pickable ? 1 : 0)
    }
    const shaderCode = MeshShaderCode
    const renderItem = createGraphicsRenderItem(ctx, 'triangles', shaderCode, schema, { ...values, ...internalValues }, materialId)

    return createRenderable(renderItem, values, state)
}