/*
 *  Copyright 2014 Matthieu Nicolas
 *
 *  This file is part of Mute-structs.
 *
 *  Mute-structs is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  Mute-structs is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with Mute-structs.  If not, see <http://www.gnu.org/licenses/>.
 */

import {Identifier, INT_32_MIN_VALUE, INT_32_MAX_VALUE} from './identifier'
import {IdentifierTuple} from './identifiertuple'

export function isMine (replica: number): (id: Identifier) => boolean {
    return (id: Identifier) => id.tuples[id.length - 1].replicaNumber === replica
}

export function createBetweenPosition (id1: Identifier | null,
    id2: Identifier | null, replicaNumber: number, clock: number): Identifier {

    console.assert(Number.isSafeInteger(replicaNumber), "replicaNumber must be a safe integer")
    console.assert(Number.isSafeInteger(clock) && clock >= 0, "clock must be a positive safe integer")

    const minTuple: IdentifierTuple = new IdentifierTuple(INT_32_MIN_VALUE, 0, 0, 0)
    const maxTuple: IdentifierTuple = new IdentifierTuple(INT_32_MAX_VALUE, 0, 0, 0)

    const tuples1: IdentifierTuple[] = id1 !== null ? id1.tuples : []
    const seq1: IterableIterator<IdentifierTuple> = infiniteSequence(tuples1, minTuple)
    const tuples2: IdentifierTuple[] = id2 !== null ? id2.tuples : []
    const seq2: IterableIterator<IdentifierTuple> = infiniteSequence(tuples2, maxTuple)

    const tuples: IdentifierTuple[] = []

    do {
        const tuple1: IdentifierTuple = seq1.next().value
        const tuple2: IdentifierTuple = seq2.next().value
        if (tuple2.random - tuple1.random > 2) {
            // Can insert a new tuple between tuple1 and tuple2
            const newRandom = (Math.random() * (tuple2.random - tuple1.random - 2)) + tuple1.random + 1 // Generate a random number ∈ ]b1, b2[
            const i = newRandom | 0 // Truncate the float in order to get a 32bits int
            tuples.push(new IdentifierTuple(i, replicaNumber, clock, 0))
            break
        } else {
            // Copy the whole tuple <random, replicaNumber, clock, offset>
            tuples.push(tuple1)
        }
    } while (true)

    const id: Identifier = new Identifier(tuples)
    console.assert(isMine(replicaNumber)(id), "the generated identifier must belong to me")
    return id
}

/**
 * Generate an infinite sequence of tuples
 *
 * @param tuples
 * @param defaultValue
 */
function *infiniteSequence (tuples: IdentifierTuple[], defaultValue: IdentifierTuple): IterableIterator<IdentifierTuple> {
    for (const tuple of tuples) {
        yield tuple
    }
    while (true) {
        yield defaultValue
    }
}
