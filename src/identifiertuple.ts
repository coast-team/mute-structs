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

import {isObject} from "./data-validation"
import {isInt32} from "./int32"
import {Ordering} from "./ordering"

export class IdentifierTuple {

    static fromPlain (o: unknown): IdentifierTuple | null {
        if (isObject<IdentifierTuple>(o) &&
            isInt32(o.random) && isInt32(o.replicaNumber) &&
            isInt32(o.clock) && isInt32(o.offset)) {

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
    static fromBase (tuple: IdentifierTuple, offset: number): IdentifierTuple {
        console.assert(isInt32(offset), "offset ∈ int32")

        return new IdentifierTuple(tuple.random, tuple.replicaNumber, tuple.clock, offset)
    }

    readonly random: number
    readonly replicaNumber: number
    readonly clock: number
    readonly offset: number

    constructor (random: number, replicaNumber: number, clock: number, offset: number) {
        console.assert([random, replicaNumber, clock, offset].every(isInt32),
            "each value ∈ int32")

        this.random = random
        this.replicaNumber = replicaNumber
        this.clock = clock
        this.offset = offset
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

        if (i === array.length) {
            return Ordering.Equal
        } else if (array[i] < otherArray[i]) {
            return Ordering.Less
        } else {
            return Ordering.Greater
        }
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
