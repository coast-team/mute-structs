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
import { Ordering } from "../ordering"
import { Epoch } from "./epoch"
import { EpochId } from "./epochid"

export interface EpochStoreJSON {
    readonly epochs: Array<[string, Epoch]>
}

export function compareEpochFullIds (id1: number[], id2: number[]): Ordering {
    const minLength = id1.length < id2.length ? id1.length : id2.length
    for (let i = 0; i < minLength; i++) {
        const value1 = id1[i]
        const value2 = id2[i]

        if (value1 < value2) {
            return Ordering.Less
        } else if (value1 > value2) {
            return Ordering.Greater
        }
    }
    if (id1.length < id2.length) {
        return Ordering.Less
    } else if (id1.length > id2.length) {
        return Ordering.Greater
    } else {
        return Ordering.Equal
    }
}

export class EpochStore {

    static fromPlain (o: unknown): EpochStore | null {
        if (isObject<EpochStoreJSON>(o) && Array.isArray(o.epochs) && o.epochs.length > 0) {

            const epochs = o.epochs
                .filter(isArrayFromMap)
                .map(([_, v]) => {
                    return Epoch.fromPlain(v)
                })
                .filter((epoch): epoch is Epoch => epoch !== null)

            if (o.epochs.length === epochs.length) {
                const [origin, ...rest] = epochs
                const epochStore = new EpochStore(origin)
                rest.forEach((epoch) => {
                    epochStore.addEpoch(epoch)
                })
                return epochStore
            }
        }
        return null
    }

    private epochs: Map<string, Epoch>

    constructor (origin: Epoch) {
        this.epochs = new Map()
        this.addEpoch(origin)
    }

    addEpoch (epoch: Epoch) {
        this.epochs.set(epoch.id.asStr, epoch)
    }

    hasEpoch (epoch: Epoch): boolean {
        return this.epochs.has(epoch.id.asStr)
    }

    getEpoch (epochId: EpochId): Epoch | undefined {
        return this.epochs.get(epochId.asStr)
    }

    getEpochFullId (epoch: Epoch): number[] {
        console.assert(this.hasEpoch(epoch),
            "The epoch should have been added to the store previously")

        let parentEpochFullId: number[] = []
        if (epoch.parentId !== undefined) {
            const parentEpoch = this.getEpoch(epoch.parentId)
            if (parentEpoch !== undefined) {
                parentEpochFullId = this.getEpochFullId(parentEpoch)
            }
        }
        return parentEpochFullId.concat(epoch.id.replicaNumber, epoch.id.epochNumber)
    }

    getEpochPath (epoch: Epoch): Epoch[] {
        const pathEpoch: Epoch[] = []
        let currentEpoch: Epoch | undefined = epoch
        while (currentEpoch !== undefined) {
            pathEpoch.push(currentEpoch)
            currentEpoch = currentEpoch.parentId !== undefined ? this.getEpoch(currentEpoch.parentId) : undefined
        }
        return pathEpoch.reverse()
    }

    getPathBetweenEpochs (from: Epoch, to: Epoch): [Epoch[], Epoch[]] {
        const fromPath = this.getEpochPath(from)
        const toPath = this.getEpochPath(to)

        let i = 0
        while (i < fromPath.length && i < toPath.length && fromPath[i].equals(toPath[i])) {
            i++
        }
        return [fromPath.slice(i).reverse(), toPath.slice(i)]
    }

    toJSON (): EpochStoreJSON {
        return { epochs: Array.from(this.epochs) }
    }
}
