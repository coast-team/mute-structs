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

import { isObject } from "./data-validation"
import { Epoch} from "./epoch/epoch"
import { EpochId } from "./epoch/epochid"
import { EpochStore } from "./epoch/epochstore"
import { flatten } from "./helpers"
import { Identifier } from "./identifier"
import { IdentifierInterval } from "./identifierinterval"
import { createAtPosition } from "./idfactory"
import { LogootSRopes } from "./logootsropes"
import { LogootSDel } from "./operations/delete/logootsdel"
import { RenamableLogootSDel } from "./operations/delete/renamablelogootsdel"
import { TextDelete } from "./operations/delete/textdelete"
import { LogootSAdd } from "./operations/insert/logootsadd"
import { RenamableLogootSAdd } from "./operations/insert/renamablelogootsadd"
import { TextInsert } from "./operations/insert/textinsert"
import { LogootSRename } from "./operations/rename/logootsrename"
import { ExtendedRenamingMap } from "./renamingmap/extendedrenamingmap"
import { RenamingMap } from "./renamingmap/renamingmap"
import { RenamingMapStore } from "./renamingmap/renamingmapstore"
import { mkNodeAt } from "./ropesnodes"

function generateInsertOps (idIntervals: IdentifierInterval[], str: string): LogootSAdd[] {
    let currentOffset = 0
    return idIntervals
        .map((idInterval: IdentifierInterval): LogootSAdd => {
            const nextOffset = currentOffset + idInterval.length
            const content = str.slice(currentOffset, nextOffset)
            currentOffset = nextOffset
            return new LogootSAdd(idInterval.idBegin, content)
        })
}

export interface RenamableReplicableListJSON {
    readonly epochsStore: EpochStore
    readonly renamingMapStore: RenamingMapStore
    readonly list: LogootSRopes
    readonly currentEpoch: Epoch
}

export class RenamableReplicableList {

    static create (replicaNumber = 0, clock = 0): RenamableReplicableList {
        const list = new LogootSRopes(replicaNumber, clock)

        const currentEpoch = new Epoch(new EpochId(0, 0))
        const epochsStore = new EpochStore(currentEpoch)
        const renamingMapStore = new RenamingMapStore()

        return new RenamableReplicableList(list, currentEpoch, epochsStore, renamingMapStore)
    }

    static fromPlain (o: unknown): RenamableReplicableList | null {
        if (isObject<RenamableReplicableListJSON>(o)) {

            const list = LogootSRopes.fromPlain(o.list)
            const epochsStore = EpochStore.fromPlain(o.epochsStore)
            const renamingMapStore = RenamingMapStore.fromPlain(o.renamingMapStore)
            const currentEpoch = Epoch.fromPlain(o.currentEpoch)

            if (list !== null && epochsStore !== null &&
                renamingMapStore !== null && currentEpoch !== null) {

                return new RenamableReplicableList(list, currentEpoch, epochsStore, renamingMapStore)
            }
        }
        return null
    }

    readonly epochsStore: EpochStore
    readonly renamingMapStore: RenamingMapStore
    private list: LogootSRopes
    private currentEpoch: Epoch

    private constructor (
        list: LogootSRopes, currentEpoch: Epoch,
        epochsStore: EpochStore, renamingMapStore: RenamingMapStore) {

        this.list = list
        this.currentEpoch = currentEpoch
        this.epochsStore = epochsStore
        this.renamingMapStore = renamingMapStore
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
            const newIds = this.renameIdsFromEpochToCurrent(op.insertedIds, epoch)
            const newIdIntervals = IdentifierInterval.mergeIdsIntoIntervals(newIds)

            const insertOps = generateInsertOps(newIdIntervals, op.content)
            return insertOps
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
        if (!epoch.equals(this.currentEpoch)) {
            const idsToRename = op.lid
                .map((idInterval: IdentifierInterval): Identifier[] => idInterval.toIds())
                .reduce(flatten)

            const newIds = this.renameIdsFromEpochToCurrent(idsToRename, epoch)
            const newIdIntervals = IdentifierInterval.mergeIdsIntoIntervals(newIds)

            const newOp = new LogootSDel(newIdIntervals, op.author)
            return newOp.execute(this.list)
        }
        return op.execute(this.list)
    }

    renameLocal (): LogootSRename {
        const renamedIdIntervals = this.list.toList()
        const clock = this.clock

        const newEpochNumber = this.currentEpoch.id.epochNumber + 1
        const newEpochId = new EpochId(this.replicaNumber, newEpochNumber)
        this.currentEpoch = new Epoch(newEpochId, this.currentEpoch.id)

        this.epochsStore.addEpoch(this.currentEpoch)

        const newRandom = renamedIdIntervals[0].idBegin.tuples[0].random
        const renamingMap = new RenamingMap(this.replicaNumber, clock, renamedIdIntervals)
        this.renamingMapStore.add(this.currentEpoch, renamingMap)

        const baseId = createAtPosition(this.replicaNumber, clock, newRandom, 0)
        const newRoot = mkNodeAt(baseId, this.str.length)

        this.list = new LogootSRopes(this.replicaNumber, clock + 1, newRoot, this.str)

        return new LogootSRename(this.replicaNumber, clock, this.currentEpoch, renamedIdIntervals)
    }

    renameRemote (replicaNumber: number, clock: number, newEpoch: Epoch,
                  renamedIdIntervals: IdentifierInterval[]) {

        const renamingMap = new RenamingMap(replicaNumber, clock, renamedIdIntervals)
        this.epochsStore.addEpoch(newEpoch)
        this.renamingMapStore.add(newEpoch, renamingMap)

        const newEpochFullId = this.epochsStore.getEpochFullId(newEpoch)
        const currentEpochFullId = this.epochsStore.getEpochFullId(this.currentEpoch)

        if (currentEpochFullId < newEpochFullId) {
            const previousEpoch = this.currentEpoch
            this.currentEpoch = newEpoch

            const idIntervalsToRename = this.list.toList()
            const newIdIntervals = this.renameIdIntervalsFromEpochToCurrent(idIntervalsToRename, previousEpoch)

            const newList = new LogootSRopes(this.replicaNumber, this.clock)
            const insertOps = generateInsertOps(newIdIntervals, this.str)
            insertOps.forEach((insertOp: LogootSAdd) => {
                insertOp.execute(newList)
            })
            this.list = newList
        }
    }

    renameIdsFromEpochToCurrent (idsToRename: Identifier[], fromEpoch: Epoch): Identifier[] {
        const [epochsToRevert, epochsToApply] =
            this.epochsStore.getPathBetweenEpochs(fromEpoch, this.currentEpoch)

        const revertFns: Array<(id: Identifier) =>  Identifier> =
            epochsToRevert.map((epoch: Epoch) => {
                const rmap = this.renamingMapStore.getExtendedRenamingMap(epoch.id) as ExtendedRenamingMap
                return (id: Identifier) => rmap.reverseRenameId(id)
            })

        const applyFns: Array<(id: Identifier) =>  Identifier> =
            epochsToApply.map((epoch: Epoch) => {
                const rmap = this.renamingMapStore.getExtendedRenamingMap(epoch.id) as ExtendedRenamingMap
                return (id: Identifier) => rmap.renameId(id)
            })

        const transformationFns = revertFns.concat(applyFns)

        const renamedIds =
            transformationFns.reduce((ids, transformationFn) => ids.map(transformationFn), idsToRename)

        return renamedIds
    }

    renameIdIntervalsFromEpochToCurrent (
        idIntervalsToRename: IdentifierInterval[],
        fromEpoch: Epoch): IdentifierInterval[] {

        const [epochsToRevert, epochsToApply] =
            this.epochsStore.getPathBetweenEpochs(fromEpoch, this.currentEpoch)

        const revertFns: Array<(idInterval: IdentifierInterval) =>  IdentifierInterval[]> =
            epochsToRevert.map((epoch: Epoch) => {
                const rmap = this.renamingMapStore.getExtendedRenamingMap(epoch.id) as ExtendedRenamingMap
                return (idInterval: IdentifierInterval) => {
                    const newIds = idInterval.toIds().map((id: Identifier) => rmap.reverseRenameId(id))
                    return IdentifierInterval.mergeIdsIntoIntervals(newIds)
                }
            })

        const applyFns: Array<(idInterval: IdentifierInterval) =>  IdentifierInterval[]> =
            epochsToApply.map((epoch: Epoch) => {
                const rmap = this.renamingMapStore.getExtendedRenamingMap(epoch.id) as ExtendedRenamingMap
                return (idInterval: IdentifierInterval) => rmap.renameIdInterval(idInterval)
            })

        const transformationFns = revertFns.concat(applyFns)

        const renamedIdIntervals = transformationFns
            .reduce((idIntervals, transformationFn) => {
                return idIntervals.map(transformationFn).reduce(flatten)
            }, idIntervalsToRename)

        return renamedIdIntervals
    }

    getNbBlocks (): number {
        return this.list.toList().length
    }

    digest (): number {
        return this.list.digest()
    }
}
