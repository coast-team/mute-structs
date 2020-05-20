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

    renameId (id: Identifier): Identifier {
        const minFirstId = this.firstId.compareTo(this.newFirstId) === Ordering.Less ?
            this.firstId : this.newFirstId
        const maxLastId = this.lastId.compareTo(this.newLastId) === Ordering.Greater ?
            this.lastId : this.newLastId

        if (id.compareTo(minFirstId) === Ordering.Less || maxLastId.compareTo(id) === Ordering.Less) {
            return id
        }

        if (id.compareTo(this.firstId) === Ordering.Less) {
            // newFirstId < id < firstId
            // Happens if id.random = firstId.random && id.replicaNumber < firstId.replicaNumber
            const closestPredecessorOfNewFirstId: Identifier =
                Identifier.fromBase(this.newFirstId, this.newFirstId.lastOffset - 1)
            return closestPredecessorOfNewFirstId.concat(id)
        }

        const [found, index] = this.findIndexOfIdOrPredecessor(id)
        if (found) {
            return createAtPosition(this.replicaNumber, this.clock, this.newRandom, index)
        } else {
            const predecessorId = this.findIdFromIndex(index)
            const newPredecessorId =
                createAtPosition(this.replicaNumber, this.clock, this.newRandom, index)
            // Several cases possible

            // 1.  id is such as id = predecessorId + MIN_TUPLE + tail
            //     with tail < predecessorId
            if (predecessorId.length + 1 < id.length) {
                const [prefix, suffix] = id.truncate(predecessorId.length)
                const [_, tail] = suffix.truncate(1)
                if (prefix.compareTo(predecessorId) === Ordering.Equal
                    && suffix.tuples[0].compareTo(MIN_TUPLE) === Ordering.Equal
                    && tail.compareTo(predecessorId) === Ordering.Less) {

                    return newPredecessorId.concat(tail)
                }
            }
            return newPredecessorId.concat(id)
        }
    }

    renameIdInterval (idInterval: IdentifierInterval): IdentifierInterval[] {
        const idBegin = idInterval.idBegin
        const idEnd = idInterval.idEnd

        const minFirstId = this.firstId.compareTo(this.newFirstId) === Ordering.Less ?
            this.firstId : this.newFirstId
        const maxLastId = this.lastId.compareTo(this.newLastId) === Ordering.Greater ?
            this.lastId : this.newLastId

        if (idEnd.compareTo(minFirstId) === Ordering.Less || maxLastId.compareTo(idBegin) === Ordering.Less) {
            return [idInterval]
        }

        if (idEnd.compareTo(this.firstId) === Ordering.Less) {
            // newFirstId < idInterval < firstId
            // Happens if id.random = firstId.random && id.replicaNumber < firstId.replicaNumber
            const closestPredecessorOfNewFirstId: Identifier =
                Identifier.fromBase(this.newFirstId, this.newFirstId.lastOffset - 1)
            const newIdBegin = closestPredecessorOfNewFirstId.concat(idBegin)
            return [new IdentifierInterval(newIdBegin, idInterval.end)]
        }

        const idIntervalIndex = this.findIndexOfRelevantIdInterval(idBegin)
        const relevantIdInterval = this.renamedIdIntervals[idIntervalIndex]

        if (relevantIdInterval.idEnd.compareTo(idBegin) === Ordering.Less) {
            const newOffset = this.indexes[idIntervalIndex] + relevantIdInterval.length - 1
            const newPredecessorId =
                createAtPosition(this.replicaNumber, this.clock, this.newRandom, newOffset)
            const newIdBegin = newPredecessorId.concat(idBegin)
            return [new IdentifierInterval(newIdBegin, idInterval.end)]
        } else {
            const offset = idBegin.tuples[relevantIdInterval.idBegin.length - 1].offset
            const diff = offset - relevantIdInterval.begin
            const newOffset = this.indexes[idIntervalIndex] + diff

            if (idBegin.length === relevantIdInterval.idBegin.length) {
                const newIdBegin =
                    createAtPosition(this.replicaNumber, this.clock, this.newRandom, newOffset)
                if (relevantIdInterval.end < idInterval.end) {
                    const newEnd = this.indexes[idIntervalIndex + 1] - 1
                    const newIdInterval = new IdentifierInterval(newIdBegin, newEnd)
                    const toto = Identifier.fromBase(idBegin, relevantIdInterval.end + 1)
                    const titi = newIdInterval.idEnd.concat(toto)
                    const tata = new IdentifierInterval(titi, idInterval.end)
                    return [newIdInterval, tata]
                } else {
                    const newEnd = newOffset + idInterval.length - 1
                    const newIdInterval = new IdentifierInterval(newIdBegin, newEnd)
                    return [newIdInterval]
                }
            } else {
                // Split
                const newPredecessorId =
                    createAtPosition(this.replicaNumber, this.clock, this.newRandom, newOffset)
                const newIdBegin = newPredecessorId.concat(idBegin)
                return [new IdentifierInterval(newIdBegin, idInterval.end)]
            }
        }
    }

    reverseRenameId (id: Identifier): Identifier {
        if (this.hasBeenRenamed(id)) {
            // id ∈ renamedIds
            return this.findIdFromIndex(id.lastOffset)
        }

        const closestPredecessorOfNewFirstId: Identifier =
                Identifier.fromBase(this.newFirstId, this.newFirstId.lastOffset - 1)

        const minFirstId = this.firstId.compareTo(closestPredecessorOfNewFirstId) === Ordering.Less ?
            this.firstId : closestPredecessorOfNewFirstId
        const maxLastId = this.lastId.compareTo(this.newLastId) === Ordering.Greater ?
            this.lastId : this.newLastId

        if (id.compareTo(minFirstId) === Ordering.Less
            || maxLastId.compareTo(id) === Ordering.Less) {

            return id
        }

        if (id.compareTo(this.newFirstId) === Ordering.Less) {
            // closestPredecessorOfNewFirstId < id < newFirstId
            console.assert(this.newFirstId.compareTo(this.firstId) === Ordering.Less,
                "Reaching this case should imply that newFirstId < firstId")

            const [_, end] = id.truncate(1)

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
        const [head, tail] = id.truncate(1)
        const [predecessorId, successorId] =
            this.findPredecessorAndSuccessorFromIndex(head.lastOffset)

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

    findIndexOfIdOrPredecessor (id: Identifier): [boolean, number] {
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
                return [other.idBegin.length === id.length, this.indexes[m] + diff]
            }
        }
        // Could not find id in the renamedIdIntervals
        // Return the predecessor's index in this case
        if (this.indexes.length <= l) {
            // lastId < id
            return [false, this.maxOffset]
        }
        return [false, this.indexes[l] - 1]
    }

    findIndexOfRelevantIdInterval (id: Identifier): number {
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
                return m
            }
        }
        return l - 1
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
