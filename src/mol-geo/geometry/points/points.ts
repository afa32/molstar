/**
 * Copyright (c) 2018 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */

import { ValueCell } from 'mol-util'
import { Mat4 } from 'mol-math/linear-algebra'
import { transformPositionArray/* , transformDirectionArray, getNormalMatrix */ } from '../../util';
import { Geometry, Theme } from '../geometry';
import { PointsValues } from 'mol-gl/renderable';
import { RuntimeContext } from 'mol-task';
import { createColors } from '../color-data';
import { createMarkers } from '../marker-data';
import { createSizes } from '../size-data';
import { TransformData } from '../transform-data';
import { LocationIterator } from '../../util/location-iterator';
import { ParamDefinition as PD } from 'mol-util/param-definition';
import { calculateBoundingSphere } from 'mol-gl/renderable/util';
import { Sphere3D } from 'mol-math/geometry';

/** Point cloud */
export interface Points {
    readonly kind: 'points',
    /** Number of vertices in the point cloud */
    pointCount: number,
    /** Vertex buffer as array of xyz values wrapped in a value cell */
    readonly centerBuffer: ValueCell<Float32Array>,
    /** Group buffer as array of group ids for each vertex wrapped in a value cell */
    readonly groupBuffer: ValueCell<Float32Array>,
}

export namespace Points {
    export function createEmpty(points?: Points): Points {
        const cb = points ? points.centerBuffer.ref.value : new Float32Array(0)
        const gb = points ? points.groupBuffer.ref.value : new Float32Array(0)
        return {
            kind: 'points',
            pointCount: 0,
            centerBuffer: points ? ValueCell.update(points.centerBuffer, cb) : ValueCell.create(cb),
            groupBuffer: points ? ValueCell.update(points.groupBuffer, gb) : ValueCell.create(gb),
        }
    }

    export function transformImmediate(points: Points, t: Mat4) {
        transformRangeImmediate(points, t, 0, points.pointCount)
    }

    export function transformRangeImmediate(points: Points, t: Mat4, offset: number, count: number) {
        const c = points.centerBuffer.ref.value
        transformPositionArray(t, c, offset, count)
        ValueCell.update(points.centerBuffer, c);
    }

    //

    export const Params = {
        ...Geometry.Params,
        pointSizeAttenuation: PD.Boolean('Point Size Attenuation', '', false),
        pointFilledCircle: PD.Boolean('Point Filled Circle', '', false),
        pointEdgeBleach: PD.Numeric('Point Edge Bleach', '', 0.2, 0, 1, 0.05),
    }
    export const DefaultProps = PD.getDefaultValues(Params)
    export type Props = typeof DefaultProps

    export async function createValues(ctx: RuntimeContext, points: Points, transform: TransformData, locationIt: LocationIterator, theme: Theme, props: Props): Promise<PointsValues> {
        const { instanceCount, groupCount } = locationIt
        const color = await createColors(ctx, locationIt, theme.color)
        const size = await createSizes(ctx, locationIt, theme.size)
        const marker = createMarkers(instanceCount * groupCount)

        const counts = { drawCount: points.pointCount, groupCount, instanceCount }

        const boundingSphere = calculateBoundingSphere(
            points.centerBuffer.ref.value, points.pointCount,
            transform.aTransform.ref.value, transform.instanceCount.ref.value
        )

        return {
            aPosition: points.centerBuffer,
            aGroup: points.groupBuffer,
            boundingSphere: ValueCell.create(boundingSphere),
            ...color,
            ...size,
            ...marker,
            ...transform,

            ...Geometry.createValues(props, counts),
            dPointSizeAttenuation: ValueCell.create(props.pointSizeAttenuation),
            dPointFilledCircle: ValueCell.create(props.pointFilledCircle),
            uPointEdgeBleach: ValueCell.create(props.pointEdgeBleach),
        }
    }

    export function updateValues(values: PointsValues, props: Props) {
        const boundingSphere = calculateBoundingSphere(
            values.aPosition.ref.value, Math.floor(values.aPosition.ref.value.length / 3),
            values.aTransform.ref.value, values.instanceCount.ref.value
        )
        if (!Sphere3D.equals(boundingSphere, values.boundingSphere.ref.value)) {
            ValueCell.update(values.boundingSphere, boundingSphere)
        }

        Geometry.updateValues(values, props)
        ValueCell.updateIfChanged(values.dPointSizeAttenuation, props.pointSizeAttenuation)
        ValueCell.updateIfChanged(values.dPointFilledCircle, props.pointFilledCircle)
        ValueCell.updateIfChanged(values.uPointEdgeBleach, props.pointEdgeBleach)
    }
}