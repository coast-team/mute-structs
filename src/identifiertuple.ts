/*
 *  Copyright 2017 Matthieu Nicolas
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

import {SafeAny} from 'safe-any'

import {INT_32_MIN_VALUE, INT_32_MAX_VALUE} from './identifier'
import {Ordering} from './ordering'

export class IdentifierTuple {

    readonly random: number
    readonly replicaNumber: number
    readonly clock: number
    readonly offset: number

    constructor (random: number, replicaNumber: number, clock: number, offset: number) {
        [random, replicaNumber, clock].forEach((value) => {
            console.assert(Number.isSafeInteger(value), "Each value must be a safe integer")
            console.assert(value >= INT_32_MIN_VALUE && value <= INT_32_MAX_VALUE, "Each value ∈ [INT_32_MIN_VALUE, INT_32_MAX_VALUE]")
        })
        console.assert(Number.isSafeInteger(offset), "offset must be a safe integer")
        console.assert(offset > INT_32_MIN_VALUE && offset <= INT_32_MAX_VALUE, "offset ∈ ]INT_32_MIN_VALUE, INT_32_MAX_VALUE]")

        this.random = random
        this.replicaNumber = replicaNumber
        this.clock = clock
        this.offset = offset
    }

    static fromPlain (o: SafeAny<IdentifierTuple>): IdentifierTuple | null {
        if (typeof o === "object" && o !== null &&
            typeof o.random === "number" && Number.isSafeInteger(o.random) &&
            INT_32_MIN_VALUE <= o.random && o.random <= INT_32_MAX_VALUE &&
            typeof o.replicaNumber === "number" && Number.isSafeInteger(o.replicaNumber) &&
            INT_32_MIN_VALUE <= o.replicaNumber && o.replicaNumber <= INT_32_MAX_VALUE &&
            typeof o.clock === "number" && Number.isSafeInteger(o.clock) &&
            INT_32_MIN_VALUE <= o.clock && o.clock <= INT_32_MAX_VALUE &&
            typeof o.offset === "number" && Number.isSafeInteger(o.offset) &&
            INT_32_MIN_VALUE < o.clock && o.clock <= INT_32_MAX_VALUE) {

            return new IdentifierTuple(o.random, o.replicaNumber, o.clock, o.offset)
        }
        return null
    }

    /**
     * Generate a new IdentifierTuple with the same base as the provided one but with a different offset
     *
     * @param {tuple} IdentifierTuple The tuple to partly copy
     * @param {number} offset The offset of the new IdentifierTuple
     * @return {IdentifierTuple} The generated IdentifierTuple
     */
    static generateWithSameBase (tuple: IdentifierTuple, offset: number): IdentifierTuple {
        console.assert(Number.isSafeInteger(offset), "offset must be a safe integer")
        console.assert(offset > INT_32_MIN_VALUE && offset <= INT_32_MAX_VALUE, "offset ∈ ]INT_32_MIN_VALUE, INT_32_MAX_VALUE]")

        return new IdentifierTuple(tuple.random, tuple.replicaNumber, tuple.clock, offset)
    }

    /**
     * Compare this tuple to another one to order them
     * Ordering.Less means that this is less than other
     * Ordering.Greater means that this is greater than other
     * Ordering.Equal means that this is equals to other
     *
     * @param {IdentifierTuple} other The tuple to compare
     * @return {Ordering} The order of the two tuples
     */
    compareTo (other: IdentifierTuple): Ordering {
        const array: number[] = this.asArray()
        const otherArray: number[] = other.asArray()
        let i = 0

        while (i < array.length && array[i] === otherArray[i]) {
            i++
        }

        if (array[i] < otherArray[i]) {
            return Ordering.Less
        } else if (array[i] > otherArray[i]) {
            return Ordering.Greater
        }
        return Ordering.Equal
    }

    equals (other: IdentifierTuple): boolean {
        return this.equalsBase(other)
            && this.offset === other.offset
    }

    /**
     * Check if this tuple and another one share the same base
     * The base is composed of a random number, a replicaNumber and a clock
     *
     * @param {IdentifierTuple} other The tuple to compare
     * @return {boolean} Are the two tuple sharing the same base
     */
    equalsBase (other: IdentifierTuple): boolean {
        return this.random === other.random
            && this.replicaNumber === other.replicaNumber
            && this.clock === other.clock
    }

    /**
     * Map the tuple to an array, making it easier to browse
     *
     * @return {number[]} The tuple as an array
     */
    asArray (): number[] {
        return [this.random, this.replicaNumber, this.clock, this.offset]
    }

    digest (): number {
        return this.asArray().reduce((prev, v) => (prev * 17 + v) | 0, 0)
    }

    toString (): string {
        return `${this.random},${this.replicaNumber},${this.clock},${this.offset}`
    }
}
