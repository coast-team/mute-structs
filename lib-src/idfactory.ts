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
import {InfiniteString} from './infinitestring'


export function isMine (replica: number): (b: number[]) => boolean {
    return (base: number[]) => base[base.length - 2] === replica
}

export function createBetweenPosition (id1: Identifier | null,
        id2: Identifier | null, replicaNumber: number, clock: number): number[] {

    console.assert(id1 === null || id1 instanceof Identifier, "id1 = " + id1)
    console.assert(id2 === null || id2 instanceof Identifier, "id2 = ", id2)
    console.assert(typeof replicaNumber === "number", "replicaNumber = ", replicaNumber)
    console.assert(typeof clock === "number", "clock = ", clock)

    const s1 = new InfiniteString(id1 !== null ? id1.base.concat(id1.last) : [], INT_32_MIN_VALUE)
    const s2 = new InfiniteString(id2 !== null ? id2.base.concat(id2.last) : [], INT_32_MAX_VALUE)
    let sb: number[] = []

    do {
        const b1 = s1.next()
        const b2 = s2.next()
        if (b2 - b1 > 2) {
            const f = (Math.random() * (b2 - b1 - 2)) + b1 + 1 // Generate a random number ∈ ]b1, b2[
            const i = f | 0 // Truncate the float in order to get a 32bits int
            sb.push(i)
            break
        } else {
            // Copy the whole tuple <random, replicaNumber, clock, offset>
            sb.push(b1)
            for (let i = 0; i < 3; i++) {
              sb.push(s1.next())
              s2.next()
            }
        }
    } while (true)

    sb.push(replicaNumber)
    sb.push(clock)

    console.assert(isMine(replicaNumber)(sb),
        "replica = " + replicaNumber + " base = ", sb)
    return sb
}
