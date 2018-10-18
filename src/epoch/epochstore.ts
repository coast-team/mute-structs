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

import {Epoch} from "./epoch"
import {EpochId} from "./epochid"

export class EpochStore {

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
}
