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

import {Identifier} from "../identifier"
import {IdentifierInterval} from "../identifierinterval"
import {createAtPosition, MAX_TUPLE, MIN_TUPLE} from "../idfactory"
import {Ordering} from "../ordering"
import {RenamingMap} from "./renamingmap"

const findPredecessor = (renamedIdIntervals: IdentifierInterval[], id: Identifier): Identifier => {
    let l = 0
    let r = renamedIdIntervals.length
    while (l < r) {
        const m = Math.floor((l + r) / 2)
        const other = renamedIdIntervals[m]
        if (other.idEnd.compareTo(id) === Ordering.Less) {
            l = m + 1
        } else if (id.compareTo(other.idBegin) === Ordering.Less) {
            r = m
        } else {
            const offset = id.tuples[other.idBegin.length - 1].offset
            return Identifier.fromBase(other.idBegin, offset)
        }
    }
    return renamedIdIntervals[l - 1].idEnd
}

interface BaseAndOffset {
    base: Identifier
    offset: number
}

export class ExtendedRenamingMap {

    static fromRenamingMap (renamingMap: RenamingMap): ExtendedRenamingMap {
        const replicaNumber = renamingMap.replicaNumber
        const clock = renamingMap.clock
        const renamedIdIntervals = renamingMap.renamedIdIntervals
        return new ExtendedRenamingMap(replicaNumber, clock, renamedIdIntervals)
    }

    readonly replicaNumber: number
    readonly clock: number
    readonly renamedIdIntervals: IdentifierInterval[]
    readonly map: Map<number, Map<number, Map<number, number>>>
    readonly newOffsetToOldIdMap: Map<number, BaseAndOffset>
    readonly maxOffset: number

    constructor (replicaNumber: number, clock: number, renamedIdIntervals: IdentifierInterval[]) {
        this.replicaNumber = replicaNumber
        this.clock = clock
        this.renamedIdIntervals = renamedIdIntervals
        this.map = new Map()
        this.newOffsetToOldIdMap = new Map()

        let index = 0
        renamedIdIntervals.forEach((idInterval) => {
            const id = idInterval.idBegin
            if (!this.map.has(id.replicaNumber)) {
                this.map.set(id.replicaNumber, new Map())
            }
            const clockMap: Map<number, Map<number, number>> =
                this.map.get(id.replicaNumber) as Map<number, Map<number, number>>

            if (!clockMap.has(id.clock)) {
                clockMap.set(id.clock, new Map())
            }

            const offsetMap: Map<number, number> =
                clockMap.get(id.clock) as Map<number, number>

            for (let i = idInterval.begin; i <= idInterval.end; i++) {
                offsetMap.set(i, index)
                this.newOffsetToOldIdMap.set(index, {base: id, offset: i})
                index++
            }
        })
        this.maxOffset = index - 1
    }

    get firstId (): Identifier {
        return this.renamedIdIntervals[0].idBegin
    }

    get lastId (): Identifier {
        return this.renamedIdIntervals[this.renamedIdIntervals.length - 1].idEnd
    }

    get newFirstId (): Identifier {
        return createAtPosition(this.replicaNumber, this.clock, this.newRandom, 0)
    }

    get newLastId (): Identifier {
        return createAtPosition(this.replicaNumber, this.clock, this.newRandom, this.maxOffset)
    }

    get newRandom (): number {
        return this.firstId.tuples[0].random
    }

    renameId (id: Identifier): Identifier {
        const replicaNumber = id.replicaNumber
        const clock = id.clock
        const offset = id.lastOffset

        if (this.map.has(replicaNumber)) {
            const clockMap = this.map.get(replicaNumber) as Map<number, Map<number, number>>
            if (clockMap.has(clock)) {
                const offsetMap = clockMap.get(clock) as Map<number, number>
                if (offsetMap.has(offset)) {
                    const newOffset = offsetMap.get(offset) as number
                    return createAtPosition(this.replicaNumber, this.clock, this.newRandom, newOffset)
                }
            }
        }

        const minFirstId = this.firstId.compareTo(this.newFirstId) === Ordering.Less ? this.firstId : this.newFirstId
        const maxLastId = this.lastId.compareTo(this.newLastId) === Ordering.Greater ? this.lastId : this.newLastId

        if (id.compareTo(minFirstId) === Ordering.Less || maxLastId.compareTo(id) === Ordering.Less) {
            return id
        }

        if (id.compareTo(this.firstId) === Ordering.Less) {
            // newFirstId < id < firstId
            // Happens if id.random = firstId.random && 0 < id.replicaNumber <= firstId.replicaNumber
            const closestPredecessorOfNewFirstId: Identifier =
                Identifier.fromBase(this.newFirstId, this.newFirstId.lastOffset - 1)
            return closestPredecessorOfNewFirstId.concat(id)
        }

        // The submitted id was not part of the renaming, need to compute a new one
        const predecessorId: Identifier = findPredecessor(this.renamedIdIntervals, id)
        const newPredecessorId = this.renameId(predecessorId)

        return newPredecessorId.concat(id)
    }

    reverseRenameId (id: Identifier): Identifier {
        if (this.hasBeenRenamed(id)) {
            // id ∈ renamedIds
            return this.getOldIdFromIndex(id.lastOffset)
        }

        const closestPredecessorOfNewFirstId: Identifier =
                Identifier.fromBase(this.newFirstId, this.newFirstId.lastOffset - 1)

        const minFirstId = this.firstId.compareTo(closestPredecessorOfNewFirstId) === Ordering.Less ?
            this.firstId : closestPredecessorOfNewFirstId
        const maxLastId = this.lastId.compareTo(this.newLastId) === Ordering.Greater ? this.lastId : this.newLastId

        if (id.compareTo(minFirstId) === Ordering.Less
            || maxLastId.compareTo(id) === Ordering.Less) {

            return id
        }

        if (id.compareTo(this.newFirstId) === Ordering.Less) {
            // closestPredecessorOfNewFirstId < id < newFirstId
            console.assert(this.newFirstId.compareTo(this.firstId) === Ordering.Less,
                "Reaching this case should imply that newFirstId < firstId")

            const closestPredecessorOfFirstId: Identifier =
                Identifier.fromBase(this.firstId, this.firstId.lastOffset - 1)
            const [_, end] = id.truncate(1)

            if (end.tuples[0].random === this.newRandom) {
                // This case corresponds to the following scenario:
                // - end was inserted concurrently to the renaming operation with
                //      newFirstId < end < firstId
                // - so with
                //      newFirst.random = end.random = firstId.random
                //   and
                //      newFirst.author < end.author < firstId.author
                // - id was thus obtained by concatenating closestPredecessorOfNewFirstId + end
                // To revert the renaming, just need to return end
                return end
            }
            if (closestPredecessorOfFirstId.compareTo(end) === Ordering.Less) {
                return closestPredecessorOfFirstId.concat(end)
            }
            return id
        }

        if (this.newLastId.compareTo(id) === Ordering.Less && id.compareTo(this.lastId) === Ordering.Less) {
            // newLastId < id < lastId < lastId + MIN_TUPLE + id
            return new Identifier([
                ...this.lastId.tuples,
                MIN_TUPLE,
                ...id.tuples,
            ])
        }

        // newFirstId < id < newLastId
        const [head, tail] = id.truncate(1)
        const predecessorId = this.getOldIdFromIndex(head.lastOffset)
        const successorId = this.getOldIdFromIndex(head.lastOffset + 1)

        if (tail.compareTo(predecessorId) === Ordering.Less) {
            // tail < predecessorId < predecessorId + MIN_TUPLE + tail < successorId
            return new Identifier([
                ...predecessorId.tuples,
                MIN_TUPLE,
                ...tail.tuples,
            ])
        } else if (successorId.compareTo(tail) === Ordering.Less) {
            // predecessorId < closestPredecessorOfSuccessorId + MAX_TUPLE + tail < successorId < tail
            const closestPredecessorOfSuccessorId: Identifier =
                Identifier.fromBase(successorId, successorId.lastOffset - 1)

            return new Identifier([
                ...closestPredecessorOfSuccessorId.tuples,
                MAX_TUPLE,
                ...tail.tuples,
            ])
        }
        return tail
    }

    getOldIdFromIndex (index: number): Identifier {
        const baseAndOffset = this.newOffsetToOldIdMap.get(index)
        if (baseAndOffset === undefined) {
            throw Error("should not be undefined")
        } else {
            const {base, offset} = baseAndOffset
            return Identifier.fromBase(base, offset)
        }
    }

    hasBeenRenamed (id: Identifier): boolean {
        return id.equalsBase(this.newFirstId)
            && 0 <= id.lastOffset && id.lastOffset <= this.maxOffset
    }
}
