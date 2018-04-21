/**
 * Copyright (c) 2018 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */

import { OrderedSet } from 'mol-data/int';
import { VdwRadius } from 'mol-model/structure/model/properties/atomic';
import { StructureSizeDataProps } from '.';
import { createAttributeSize } from '../data';

export function vdwSizeData(props: StructureSizeDataProps) {
    const { units, elementGroup, offsetData } = props
    const { type_symbol } = units[0].model.hierarchy.atoms
    return createAttributeSize({
        sizeFn: (elementIdx: number) => {
            const e = OrderedSet.getAt(elementGroup.elements, elementIdx)
            return VdwRadius(type_symbol.value(e))
        },
        offsetData
    })
}