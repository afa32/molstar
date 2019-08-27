/**
 * Copyright (c) 2018-2019 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */

import { Unit, StructureProperties, StructureElement, Link, Structure } from '../../mol-model/structure';

import { Color } from '../../mol-util/color';
import { Location } from '../../mol-model/location';
import { ColorTheme, LocationColor } from '../color';
import { ParamDefinition as PD } from '../../mol-util/param-definition'
import { ThemeDataContext } from '../../mol-theme/theme';
import { getPalette, getPaletteParams } from '../../mol-util/color/palette';
import { ScaleLegend } from '../../mol-util/color/scale';
import { TableLegend } from '../../mol-util/color/lists';
import { Segmentation } from '../../mol-data/int';

const DefaultColor = Color(0xFAFAFA)
const Description = 'Gives every polymer chain a color based on its `asym_id` value.'

export const PolymerIdColorThemeParams = {
    ...getPaletteParams({ type: 'set', setList: 'set-3' }),
}
export type PolymerIdColorThemeParams = typeof PolymerIdColorThemeParams
export function getPolymerIdColorThemeParams(ctx: ThemeDataContext) {
    const params = PD.clone(PolymerIdColorThemeParams)
    if (ctx.structure) {
        if (getPolymerAsymIdSerialMap(ctx.structure.root).size > 12) {
            params.palette.defaultValue.name = 'scale'
            params.palette.defaultValue.params = { list: 'red-yellow-blue' }
        }
    }
    return params
}

function getAsymId(unit: Unit): StructureElement.Property<string> {
    switch (unit.kind) {
        case Unit.Kind.Atomic:
            return StructureProperties.chain.label_asym_id
        case Unit.Kind.Spheres:
        case Unit.Kind.Gaussians:
            return StructureProperties.coarse.asym_id
    }
}

function getPolymerAsymIdSerialMap(structure: Structure) {
    const map = new Map<string, number>()
    for (let i = 0, il = structure.unitSymmetryGroups.length; i < il; ++i) {
        const unit = structure.unitSymmetryGroups[i].units[0]
        const { model } = unit
        if (Unit.isAtomic(unit)) {
            const { chainAtomSegments, chains } = model.atomicHierarchy
            const chainIt = Segmentation.transientSegments(chainAtomSegments, unit.elements)
            while (chainIt.hasNext) {
                const { index: chainIndex } = chainIt.move()
                const entityId = chains.label_entity_id.value(chainIndex)
                const eI = model.entities.getEntityIndex(entityId)
                if (model.entities.data.type.value(eI) === 'polymer') {
                    const asymId = chains.label_asym_id.value(chainIndex)
                    if (!map.has(asymId)) map.set(asymId, map.size)
                }
            }
        } else if (Unit.isCoarse(unit)) {
            const { chainElementSegments, asym_id, entity_id } = Unit.isSpheres(unit)
                ? model.coarseHierarchy.spheres
                : model.coarseHierarchy.gaussians
            const chainIt = Segmentation.transientSegments(chainElementSegments, unit.elements)
            while (chainIt.hasNext) {
                const { index: chainIndex } = chainIt.move()
                const elementIndex = chainElementSegments.offsets[chainIndex]
                const entityId = entity_id.value(elementIndex)
                const eI = model.entities.getEntityIndex(entityId)
                if (model.entities.data.type.value(eI) === 'polymer') {
                    const asymId = asym_id.value(elementIndex)
                    if (!map.has(asymId)) map.set(asymId, map.size)
                }
            }
        }
    }
    return map
}

export function PolymerIdColorTheme(ctx: ThemeDataContext, props: PD.Values<PolymerIdColorThemeParams>): ColorTheme<PolymerIdColorThemeParams> {
    let color: LocationColor
    let legend: ScaleLegend | TableLegend | undefined

    if (ctx.structure) {
        const l = StructureElement.create()
        const polymerAsymIdSerialMap = getPolymerAsymIdSerialMap(ctx.structure.root)

        const palette = getPalette(polymerAsymIdSerialMap.size, props)
        legend = palette.legend

        color = (location: Location): Color => {
            let serial: number | undefined = undefined
            if (StructureElement.isLocation(location)) {
                const asym_id = getAsymId(location.unit)
                serial = polymerAsymIdSerialMap.get(asym_id(location))
            } else if (Link.isLocation(location)) {
                const asym_id = getAsymId(location.aUnit)
                l.unit = location.aUnit
                l.element = location.aUnit.elements[location.aIndex]
                serial = polymerAsymIdSerialMap.get(asym_id(l))
            }
            return serial === undefined ? DefaultColor : palette.color(serial)
        }
    } else {
        color = () => DefaultColor
    }

    return {
        factory: PolymerIdColorTheme,
        granularity: 'group',
        color,
        props,
        description: Description,
        legend
    }
}

export const PolymerIdColorThemeProvider: ColorTheme.Provider<PolymerIdColorThemeParams> = {
    label: 'Polymer Id',
    factory: PolymerIdColorTheme,
    getParams: getPolymerIdColorThemeParams,
    defaultValues: PD.getDefaultValues(PolymerIdColorThemeParams),
    isApplicable: (ctx: ThemeDataContext) => !!ctx.structure
}