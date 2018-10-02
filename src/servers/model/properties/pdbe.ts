/**
 * Copyright (c) 2018 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */

import { Model } from 'mol-model/structure';
import { PDBe_structureQualityReport, PDBe_preferredAssembly } from './providers/pdbe';

export function attachModelProperties(model: Model, cache: object): Promise<any>[] {
    // return a list of promises that start attaching the props in parallel
    // (if there are downloads etc.)
    return [
        PDBe_structureQualityReport(model, cache),
        PDBe_preferredAssembly(model, cache)
    ];
}