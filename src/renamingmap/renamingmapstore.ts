/*
    This file is part of MUTE-structs.

    Copyright (C) 2017  Matthieu Nicolas, Victorien Elvinger

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { isArrayFromMap, isObject } from "../data-validation"
import { Epoch } from "../epoch/epoch"
import { EpochId } from "../epoch/epochid"
import { ExtendedRenamingMap } from "./extendedrenamingmap"
import { RenamingMap } from "./renamingmap"

export interface RenamingMapStoreJSON {
    readonly renamingMaps: Array<[string, RenamingMap]>
}

export class RenamingMapStore {

    static fromPlain (o: unknown): RenamingMapStore | null {
        if (isObject<RenamingMapStoreJSON>(o) &&
            Array.isArray(o.renamingMaps)) {

            const renamingMaps = o.renamingMaps
                .filter(isArrayFromMap)
                .map(([k, v]): [unknown, RenamingMap | null] => {
                    return [k, RenamingMap.fromPlain(v)]
                })
                .filter((arg): arg is [string, RenamingMap] => typeof arg[0] === "string" && arg [1] !== null)

            if (o.renamingMaps.length === renamingMaps.length) {
                const renamingMapStore = new RenamingMapStore()
                renamingMaps.forEach(([epochId, renamingMap]) => {
                    renamingMapStore.internalAdd(epochId, renamingMap)
                })
                return renamingMapStore
            }
        }
        return null
    }

    private renamingMaps: Map<string, RenamingMap>

    constructor () {
        this.renamingMaps = new Map()
    }

    add (epoch: Epoch, renamingMap: RenamingMap) {
        this.internalAdd(epoch.id.asStr, renamingMap)
    }

    getExtendedRenamingMap (epochId: EpochId): ExtendedRenamingMap | undefined {
        const renamingMap: RenamingMap | undefined = this.renamingMaps.get(epochId.asStr)
        if (renamingMap !== undefined) {
            return ExtendedRenamingMap.fromRenamingMap(renamingMap)
        }
        return undefined
    }

    toJSON (): RenamingMapStoreJSON {
        return { renamingMaps: Array.from(this.renamingMaps) }
    }

    private internalAdd (epochId: string, renamingMap: RenamingMap) {
        this.renamingMaps.set(epochId, renamingMap)
    }
}
