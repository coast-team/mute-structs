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
import {flatten} from "./helpers"
import {Identifier} from "./identifier"
import {IdentifierInterval} from "./identifierinterval"
import {createAtPosition} from "./idfactory"
import {LogootSRopes} from "./logootsropes"
import {LogootSDel} from "./operations/delete/logootsdel"
import {RenamableLogootSDel} from "./operations/delete/renamablelogootsdel"
import {TextDelete} from "./operations/delete/textdelete"
import {LogootSAdd} from "./operations/insert/logootsadd"
import {RenamableLogootSAdd} from "./operations/insert/renamablelogootsadd"
import {TextInsert} from "./operations/insert/textinsert"
import {LogootSRename} from "./operations/rename/logootsrename"
import {ExtendedRenamingMap} from "./renamingmap/extendedrenamingmap"
import {RenamingMap} from "./renamingmap/renamingmap"
import {RenamingMapStore} from "./renamingmap/renamingmapstore"
import {mkNodeAt, RopesNodes} from "./ropesnodes"

export class RenamableReplicableList {

    readonly epochsStore: EpochStore
    readonly renamingMapStore: RenamingMapStore
    private list: LogootSRopes
    private currentEpoch: Epoch

    constructor (replicaNumber = 0, clock = 0, root: RopesNodes | null = null, str = "") {
        this.list = new LogootSRopes(replicaNumber, clock, root, str)

        this.currentEpoch = new Epoch(new EpochId(0, 0))
        this.epochsStore = new EpochStore(this.currentEpoch)
        this.renamingMapStore = new RenamingMapStore()
    }

    get replicaNumber (): number {
        return this.list.replicaNumber
    }

    get clock (): number {
        return this.list.clock
    }

    get currentExtendedRenamingMap (): ExtendedRenamingMap {
        return this.renamingMapStore.getExtendedRenamingMap(this.currentEpoch.id) as ExtendedRenamingMap
    }

    getList (): LogootSRopes {
        return this.list
    }

    getCurrentEpoch (): Epoch {
        return this.currentEpoch
    }

    get str (): string {
        return this.list.str
    }

    insertLocal (pos: number, l: string): RenamableLogootSAdd {
        return new RenamableLogootSAdd(this.list.insertLocal(pos, l), this.currentEpoch)
    }

    insertRemote (epoch: Epoch, op: LogootSAdd): TextInsert[] {
        if (!epoch.equals(this.currentEpoch)) {
            const extendedRenamingMap = this.currentExtendedRenamingMap
            const idsToRename = op.insertedIds
            const newIds =
                idsToRename.map((id: Identifier) => extendedRenamingMap.getNewId(id))
            const newIdIntervals: IdentifierInterval[] = IdentifierInterval.mergeIdsIntoIntervals(newIds)
            let currentOffset = 0
            return newIdIntervals
                .map((idInterval: IdentifierInterval): LogootSAdd => {
                    const nextOffset = currentOffset + idInterval.length + 1
                    const str = op.content.slice(currentOffset, nextOffset)
                    currentOffset = nextOffset
                    return new LogootSAdd(idInterval.idBegin, str)
                })
                .map((insertOp: LogootSAdd): TextInsert[] => {
                    return insertOp.execute(this.list)
                })
                .reduce(flatten)
        }
        return op.execute(this.list)
    }

    delLocal (begin: number, end: number): RenamableLogootSDel {
        return new RenamableLogootSDel(this.list.delLocal(begin, end), this.currentEpoch)
    }

    delRemote (epoch: Epoch, op: LogootSDel): TextDelete[] {
        return op.execute(this.list)
    }

    renameLocal (): LogootSRename {
        const renamedIdIntervals = this.list.toList()

        const newEpochNumber = this.currentEpoch.id.epochNumber + 1
        const newEpochId = new EpochId(this.replicaNumber, newEpochNumber)
        this.currentEpoch = new Epoch(newEpochId, this.currentEpoch.id)

        this.epochsStore.addEpoch(this.currentEpoch)

        const newClock = this.clock + 1
        const renamingMap = new RenamingMap(this.replicaNumber, newClock, renamedIdIntervals)
        this.renamingMapStore.add(this.currentEpoch, renamingMap)

        const baseId = createAtPosition(this.replicaNumber, newClock, 0, 0)
        const newRoot = mkNodeAt(baseId, this.str.length)
        this.list = new LogootSRopes(this.replicaNumber, newClock, newRoot, this.str)

        return new LogootSRename(this.replicaNumber, newClock, this.currentEpoch, renamedIdIntervals)
    }

    renameRemote (replicaNumber: number, clock: number, newEpoch: Epoch,
                  renamedIdIntervals: IdentifierInterval[]) {

        const renamingMap = new RenamingMap(replicaNumber, clock, renamedIdIntervals)
        this.epochsStore.addEpoch(newEpoch)
        this.renamingMapStore.add(newEpoch, renamingMap)

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
