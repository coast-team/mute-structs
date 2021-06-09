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

import { isObject } from "../data-validation"
import { Identifier } from "../identifier"
import { IdentifierInterval } from "../identifierinterval"
import { createAtPosition, MAX_TUPLE, MIN_TUPLE } from "../idfactory"
import { isInt32 } from "../int32"
import { Ordering } from "../ordering"

export class RenamingMap {

    static fromPlain (o: unknown): RenamingMap | null {
        if (isObject<RenamingMap>(o) &&
            isInt32(o.replicaNumber) && isInt32(o.clock) &&
            Array.isArray(o.renamedIdIntervals) &&
            o.renamedIdIntervals.length > 0) {

            const renamedIdIntervals = o.renamedIdIntervals
                .map(IdentifierInterval.fromPlain)
                .filter((v): v is IdentifierInterval => v !== null)

            if (o.renamedIdIntervals.length === renamedIdIntervals.length) {
                return new RenamingMap(o.replicaNumber, o.clock, renamedIdIntervals)
            }
        }
        return null
    }

    readonly replicaNumber: number
    readonly clock: number
    readonly renamedIdIntervals: IdentifierInterval[]
    readonly indexes: number[]
    readonly maxOffset: number

    constructor (replicaNumber: number, clock: number, renamedIdIntervals: IdentifierInterval[]) {
        this.replicaNumber = replicaNumber
        this.clock = clock
        this.renamedIdIntervals = renamedIdIntervals
        this.indexes = []

        let index = 0
        renamedIdIntervals.forEach((idInterval) => {
            this.indexes.push(index)
            index += idInterval.length
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

    renameIds (idsToRename: Identifier[], initialIndex: number): Identifier[] {
        const renamedIds = this.renamedIdIntervals.flatMap((idInterval) => idInterval.toIds())
        let currentIndex = initialIndex
        return idsToRename.map((idToRename) => {
            while (currentIndex < renamedIds.length - 1
                && idToRename.compareTo(renamedIds[currentIndex + 1]) >= Ordering.Equal) {

                currentIndex++
            }

            if (currentIndex === -1) {
                // idToRename < firstId
                return this.renameIdLessThanFirstId(idToRename)
            } else if (currentIndex < renamedIds.length
                && idToRename.compareTo(renamedIds[currentIndex]) === Ordering.Equal) {

                // idToRename ∈ renamedIds
                return this.renameIdFromIndex(currentIndex)
            } else if (currentIndex === renamedIds.length - 1) {
                // lastId < idToRename
                return this.renameIdGreaterThanLastId(idToRename)
            } else {
                // firstId < idToRename < lastId
                const predecessorId = renamedIds[currentIndex]
                return this.renameIdFromPredecessorId(idToRename, predecessorId, currentIndex)
            }
        })
    }

    initRenameIds (idsToRename: Identifier[]): Identifier[] {
        const firstIdToRename = idsToRename[0]
        const initialIndex = this.findIndexOfIdOrPredecessor(firstIdToRename)
        return this.renameIds(idsToRename, initialIndex)
    }

    initRenameSeq (idsToRename: Identifier[]): Identifier[] {
        return this.renameIds(idsToRename, -1)
    }

    renameIdLessThanFirstId (id: Identifier): Identifier {
        console.assert(id.compareTo(this.firstId) === Ordering.Less)

        const closestPredecessorOfFirstId: Identifier =
            Identifier.fromBase(this.firstId, this.firstId.lastOffset - 1)
        const closestPredecessorOfNewFirstId: Identifier =
            Identifier.fromBase(this.newFirstId, this.newFirstId.lastOffset - 1)

        if (closestPredecessorOfFirstId.length + 1 < id.length
            && closestPredecessorOfFirstId.isPrefix(id)
            && id.tuples[closestPredecessorOfFirstId.length].compareTo(MAX_TUPLE) === Ordering.Equal) {

            const tail = id.getTail(closestPredecessorOfFirstId.length + 1)

            return closestPredecessorOfNewFirstId.concat(tail)
        }

        if (id.compareTo(this.newFirstId) === Ordering.Less) {
            return id
        }

        return closestPredecessorOfNewFirstId.concat(id)
    }

    renameIdGreaterThanLastId (id: Identifier): Identifier {
        console.assert(this.lastId.compareTo(id) === Ordering.Less)

        if (this.newLastId.compareTo(this.lastId) === Ordering.Less
            && this.lastId.length + 1 < id.length
            && this.lastId.isPrefix(id)
            && id.tuples[this.lastId.length].compareTo(MIN_TUPLE) === Ordering.Equal) {

            const tail = id.getTail(this.lastId.length + 1)
            return tail
        }

        if (this.newLastId.compareTo(id) === Ordering.Less) {
            return id
        }

        return this.newLastId.concat(id)
    }

    renameIdFromIndex (index: number): Identifier {
        return createAtPosition(this.replicaNumber, this.clock, this.newRandom, index)
    }

    renameIdFromPredecessorId (id: Identifier, predecessorId: Identifier, index: number): Identifier {
        const newPredecessorId =
            createAtPosition(this.replicaNumber, this.clock, this.newRandom, index)
        // Several cases possible

        // 1.  id is such as id = predecessorId + MIN_TUPLE + tail
        //     with tail < predecessorId
        if (predecessorId.length + 1 < id.length) {
            const tail = id.getTail(predecessorId.length + 1)
            if (predecessorId.isPrefix(id)
                && id.tuples[predecessorId.length].compareTo(MIN_TUPLE) === Ordering.Equal
                && tail.compareTo(predecessorId) === Ordering.Less) {

                return newPredecessorId.concat(tail)
            }
        }
        // 2.  id is such as id = closestPredecessorOfSuccessorId + MAX_TUPLE + tail
        //     with successorId < tail
        const successorId = this.findIdFromIndex(index + 1)
        if (successorId.length + 1 < id.length) {
            const tail = id.getTail(successorId.length + 1)

            const closestPredecessorOfSuccessorId = Identifier.fromBase(successorId, successorId.lastOffset - 1)

            if (closestPredecessorOfSuccessorId.isPrefix(id)
                && id.tuples[successorId.length].compareTo(MAX_TUPLE) === Ordering.Equal
                && successorId.compareTo(tail) === Ordering.Less) {

                return newPredecessorId.concat(tail)
            }
        }

        return newPredecessorId.concat(id)
    }

    reverseRenameId (id: Identifier): Identifier {
        if (this.hasBeenRenamed(id)) {
            // id ∈ renamedIds
            return this.findIdFromIndex(id.lastOffset)
        }

        const closestPredecessorOfNewFirstId: Identifier =
                Identifier.fromBase(this.newFirstId, this.newFirstId.lastOffset - 1)
        const closestSuccessorOfNewLastId = Identifier.fromBase(this.newLastId, this.newLastId.lastOffset + 1)

        const minFirstId = this.firstId.compareTo(closestPredecessorOfNewFirstId) === Ordering.Less ?
            this.firstId : closestPredecessorOfNewFirstId
        const maxLastId = this.lastId.compareTo(this.newLastId) === Ordering.Greater ?
            this.lastId : closestSuccessorOfNewLastId

        if (id.compareTo(minFirstId) === Ordering.Less
            || maxLastId.compareTo(id) === Ordering.Less) {

            return id
        }

        if (id.compareTo(this.newFirstId) === Ordering.Less) {
            // closestPredecessorOfNewFirstId < id < newFirstId
            console.assert(this.newFirstId.compareTo(this.firstId) === Ordering.Less,
                "Reaching this case should imply that newFirstId < firstId")

            const end = id.getTail(1)

            // Since closestPredecessorOfNewFirstId is not assigned to any element,
            // it should be impossible to generate id such as
            //      id = closestPredecessorOfNewFirstId + end with end < newFirstId
            // Thus we don't have to handle this particular case
            console.assert(this.newFirstId.compareTo(end) === Ordering.Less, "end should be such as newFirstId < end")

            if (end.tuples[0].random === this.newRandom) {
                // newFirstId < end < firstId
                console.assert(this.newFirstId.compareTo(end) === Ordering.Less &&
                    end.compareTo(this.firstId) === Ordering.Less,
                    "end.tuples[0].random = this.newRandom should imply that newFirstId < end < firstId")

                // This case corresponds to the following scenarios:
                // 1. end was inserted concurrently to the rename operation with
                //      newFirstId < end < firstId
                //    so with
                //      newFirst.random = end.random = firstId.random
                //    and
                //      newFirst.author < end.author < firstId.author
                //    id was thus obtained by concatenating closestPredecessorOfNewFirstId + end
                // 2. id was inserted between other ids from case 1., after the renaming
                // In both cases, just need to return end to revert the renaming
                return end
            } else {
                // firstId < end
                const closestPredecessorOfFirstId: Identifier =
                Identifier.fromBase(this.firstId, this.firstId.lastOffset - 1)

                return new Identifier([
                    ...closestPredecessorOfFirstId.tuples,
                    MAX_TUPLE,
                    ...end.tuples,
                ])
            }
        }

        if (this.lastId.compareTo(this.newLastId) === Ordering.Less
            && this.newLastId.compareTo(id) === Ordering.Less
            && id.compareTo(closestSuccessorOfNewLastId) === Ordering.Less) {

            // lastId < newLastId < id < closestSuccessorOfNewLastId
            // id = newLastId + tail

            const tail2 = id.getTail(1)
            if (tail2.compareTo(this.lastId) === Ordering.Less) {
                return new Identifier([
                    ...this.lastId.tuples,
                    MIN_TUPLE,
                    ...tail2.tuples,
                ])
            } else if (this.lastId.compareTo(tail2) === Ordering.Less
                && tail2.compareTo(this.newLastId) === Ordering.Less) {
                return tail2
            } else {
                return id
            }
        }

        if (this.newLastId.compareTo(id) === Ordering.Less &&
            id.compareTo(this.lastId) === Ordering.Less) {

            // newLastId < id < lastId < lastId + MIN_TUPLE + id
            return new Identifier([
                ...this.lastId.tuples,
                MIN_TUPLE,
                ...id.tuples,
            ])
        }

        // newFirstId < id < newLastId
        const tail = id.getTail(1)
        const [predecessorId, successorId] =
            this.findPredecessorAndSuccessorFromIndex(id.tuples[0].offset)

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

    hasBeenRenamed (id: Identifier): boolean {
        return id.equalsBase(this.newFirstId)
            && 0 <= id.lastOffset && id.lastOffset <= this.maxOffset
    }

    findIndexOfIdOrPredecessor (id: Identifier): number {
        let l = 0
        let r = this.renamedIdIntervals.length
        while (l < r) {
            const m = Math.floor((l + r) / 2)
            const other = this.renamedIdIntervals[m]
            if (other.idEnd.compareTo(id) === Ordering.Less) {
                l = m + 1
            } else if (id.compareTo(other.idBegin) === Ordering.Less) {
                r = m
            } else {
                // other.idBegin <= id <= other.idEnd
                // But could also means that id splits other
                const offset = id.tuples[other.idBegin.length - 1].offset
                const diff = offset - other.begin
                return this.indexes[m] + diff
            }
        }
        // Could not find id in the renamedIdIntervals
        // Return the predecessor's index in this case
        if (this.indexes.length <= l) {
            // lastId < id
            return this.maxOffset
        }
        return this.indexes[l] - 1
    }

    findIdFromIndex (index: number): Identifier {
        const [idIntervalIndex, offset] = this.findPositionFromIndex(index)
        const idBegin = this.renamedIdIntervals[idIntervalIndex].idBegin
        return Identifier.fromBase(idBegin, offset)
    }

    findPredecessorAndSuccessorFromIndex (index: number): [Identifier, Identifier] {
        const [predecessorIndex, predecessorOffset] = this.findPositionFromIndex(index)
        const predecessorIdInterval = this.renamedIdIntervals[predecessorIndex]
        const predecessorId = Identifier.fromBase(predecessorIdInterval.idBegin, predecessorOffset)
        const successorId = predecessorOffset !== predecessorIdInterval.end ?
            Identifier.fromBase(predecessorId, predecessorOffset + 1) :
            this.renamedIdIntervals[predecessorIndex + 1].idBegin
        return [predecessorId, successorId]
    }

    findPositionFromIndex (index: number): [number, number] {
        let l = 0
        let r = this.renamedIdIntervals.length
        while (l <= r) {
            const m = Math.floor((l + r) / 2)
            const otherIndex = this.indexes[m]
            const otherIdInterval = this.renamedIdIntervals[m]
            if (otherIndex + otherIdInterval.length <= index) {
                l = m + 1
            } else if (index < otherIndex) {
                r = m
            } else {
                const offset = index - otherIndex + otherIdInterval.begin
                return [m, offset]
            }
        }
        throw Error("Should have found the id in the renamedIdIntervals")
    }
}
