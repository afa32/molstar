/**
 * Copyright (c) 2019 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { createPlugin, DefaultPluginSpec } from '../../mol-plugin';
import { BuiltInTrajectoryFormat } from '../../mol-plugin-state/formats/trajectory';
import { PluginCommands } from '../../mol-plugin/commands';
import { PluginContext } from '../../mol-plugin/context';
import { Color } from '../../mol-util/color';
import './index.html';

import { Asset } from '../../mol-util/assets';
require('mol-plugin-ui/skin/light.scss');

type LoadParams = {
    url: string, format?: BuiltInTrajectoryFormat, isBinary?: boolean }

class BasicWrapper {
    plugin: PluginContext;

    init(target: string | HTMLElement) {
        this.plugin = createPlugin(typeof target === 'string' ? document.getElementById(target)! : target, {
            ...DefaultPluginSpec,
            layout: {
                initial: {
                    isExpanded: true,
                    showControls: true
                }
            },
            components: {
                remoteState: 'none'
            }
        });
    }

    async load({ url, format = 'mmcif', isBinary = false }: LoadParams) {
        await this.plugin.clear();

        const data = await this.plugin.builders.data.download({ url: Asset.Url(url), isBinary }, { state: { isGhost: true } });
        const trajectory = await this.plugin.builders.structure.parseTrajectory(data, format);

        const model = await this.plugin.builders.structure.createModel(trajectory);
        const structure = await this.plugin.builders.structure.createStructure(model);

        const components = {
            polymer: await this.plugin.builders.structure.tryCreateComponentStatic(structure, 'polymer'),
            ligand: await this.plugin.builders.structure.tryCreateComponentStatic(structure, 'ligand'),
            water: await this.plugin.builders.structure.tryCreateComponentStatic(structure, 'water'),
        };

        const builder = this.plugin.builders.structure.representation;
        const update = this.plugin.build();
        if (components.polymer) builder.buildRepresentation(update, components.polymer, { type: "cartoon", typeParams: { alpha: 1 } }, { tag: 'polymer' });
        if (components.ligand) builder.buildRepresentation(update, components.ligand, { type: "cartoon" }, { tag: 'ligand' });
        if (components.water) builder.buildRepresentation(update, components.water, { type: "cartoon", typeParams: { alpha: 1 } }, { tag: 'water' });
        await update.commit();
    }

    async loadPocket({ url, format = 'mmcif', isBinary = false }: LoadParams) {
        await this.plugin.clear();

        const data = await this.plugin.builders.data.download({ url: Asset.Url(url), isBinary }, { state: { isGhost: true } });
        const trajectory = await this.plugin.builders.structure.parseTrajectory(data, format);

        const model = await this.plugin.builders.structure.createModel(trajectory);
        const structure = await this.plugin.builders.structure.createStructure(model);

        const components = {
            polymer: await this.plugin.builders.structure.tryCreateComponentStatic(structure, 'polymer'),
            ligand: await this.plugin.builders.structure.tryCreateComponentStatic(structure, 'ligand'),
            water: await this.plugin.builders.structure.tryCreateComponentStatic(structure, 'water'),
        };

        const builder = this.plugin.builders.structure.representation;
        const update = this.plugin.build();
        if (components.polymer) builder.buildRepresentation(update, components.polymer, { type: "gaussian-surface", typeParams: { alpha: 0.3 } }, { tag: 'polymer' });
        if (components.ligand) builder.buildRepresentation(update, components.ligand, { type: "gaussian-surface" }, { tag: 'ligand' });
        if (components.water) builder.buildRepresentation(update, components.water, { type: "gaussian-surface", typeParams: { alpha: 0.3 } }, { tag: 'water' });
        await update.commit();
    }
}

(window as any).BasicMolStarWrapper = new BasicWrapper();