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

import {Epoch} from "./epoch/epoch"
import {EpochId} from "./epoch/epochid"
import {EpochStore} from "./epoch/epochstore"
import {IdentifierInterval} from "./identifierinterval"
import {createAtPosition} from "./idfactory"
import {LogootSRopes} from "./logootsropes"
import {RenamableLogootSDel} from "./operations/delete/renamablelogootsdel"
import {RenamableLogootSAdd} from "./operations/insert/renamablelogootsadd"
import {LogootSRename} from "./operations/rename/logootsrename"
import {mkNodeAt, RopesNodes} from "./ropesnodes"

export class RenamableReplicableList {

    readonly epochsStore: EpochStore
    private list: LogootSRopes
    private currentEpoch: Epoch

    constructor (replicaNumber = 0, clock = 0, root: RopesNodes | null = null, str = "") {
        this.list = new LogootSRopes(replicaNumber, clock, root, str)

        this.currentEpoch = new Epoch(new EpochId(0, 0))
        this.epochsStore = new EpochStore(this.currentEpoch)
    }

    get replicaNumber (): number {
        return this.list.replicaNumber
    }

    get clock (): number {
        return this.list.clock
    }

    getList (): LogootSRopes {
        return this.list
    }

    get str (): string {
        return this.list.str
    }

    insertLocal (pos: number, l: string): RenamableLogootSAdd {
        return new RenamableLogootSAdd(this.list.insertLocal(pos, l), this.currentEpoch)
    }

    delLocal (begin: number, end: number): RenamableLogootSDel {
        return new RenamableLogootSDel(this.list.delLocal(begin, end), this.currentEpoch)
    }

    renameLocal (): LogootSRename {
        const renamedIdIntervals = this.list.toList()

        const newEpochNumber = this.currentEpoch.id.epochNumber + 1
        const newEpochId = new EpochId(this.replicaNumber, newEpochNumber)
        this.currentEpoch = new Epoch(newEpochId, this.currentEpoch.id)

        this.epochsStore.addEpoch(this.currentEpoch)

        const newClock = this.clock + 1
        const baseId = createAtPosition(this.replicaNumber, newClock, 0, 0)
        const newRoot = mkNodeAt(baseId, this.str.length)
        this.list = new LogootSRopes(this.replicaNumber, newClock, newRoot, this.str)

        return new LogootSRename(this.replicaNumber, newClock, this.currentEpoch, renamedIdIntervals)
    }

    renameRemote (replicaNumber: number, clock: number, newEpoch: Epoch,
                  renamedIdIntervals: IdentifierInterval[]) {

        this.epochsStore.addEpoch(newEpoch)
        // TODO: Compare currentEpoch and newEpoch to determine if currentEpoch should change
        this.currentEpoch = newEpoch

        // TODO: Determine the "path" between the previous currentEpoch and the new one
        // TODO: Rename all identifiers from current state using the corresponding renamingMaps
        const baseId = createAtPosition(replicaNumber, clock, 0, 0)
        const newRoot = mkNodeAt(baseId, this.str.length)
        this.list = new LogootSRopes(this.replicaNumber, clock, newRoot, this.str)
    }

    getNbBlocks (): number {
        return this.list.toList().length
    }

    digest (): number {
        return this.list.digest()
    }
}
