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
import {Dot} from "./dot"
import {IdentifierTuple} from "./identifiertuple"
import {INT32_BOTTOM, INT32_TOP, isInt32} from "./int32"
import {Ordering} from "./ordering"

export class Identifier {

    static fromPlain (o: unknown): Identifier | null {
        if (isObject<Identifier>(o) &&
            Array.isArray(o.tuples) && o.tuples.length > 0) {

            const tuples = o.tuples.map(IdentifierTuple.fromPlain)
                .filter((v): v is IdentifierTuple => v !== null)

            if (o.tuples.length === tuples.length) {
                return new Identifier(tuples)
            }
        }
        return null
    }

    /**
     * Generate a new Identifier with the same base as the provided one but with a different offset
     *
     * @param {Identifier} id The identifier to partly copy
     * @param {number} offset The last offset of the new Identifier
     * @return {IdentifierTuple} The generated Identifier
     */
    static fromBase (id: Identifier, offset: number): Identifier {
        console.assert(isInt32(offset), "offset ∈ int32")

        const tuples: IdentifierTuple[] = id.tuples.map((tuple: IdentifierTuple, i: number) => {
            if (i === id.length - 1) {
                return IdentifierTuple.fromBase(tuple, offset)
            }
            return tuple
        })
        return new Identifier(tuples)
    }

// Access
    readonly tuples: IdentifierTuple[]

// Creation
    constructor (tuples: IdentifierTuple[]) {
        console.assert(tuples.length > 0, "tuples must not be empty")
        // Last random must be different of INT32_BOTTOM
        // This ensures a dense set.
        const lastRandom = tuples[tuples.length - 1].random
        console.assert(lastRandom > INT32_BOTTOM)

        this.tuples = tuples
    }

    /**
     * @return replica which generated this identifier.
     */
    get generator (): number {
        return this.tuples[this.tuples.length - 1].replicaNumber
    }

    /**
     * Shortcut to retrieve the length of the Identifier
     *
     * @return {number} The length
     */
    get length (): number {
        return this.tuples.length
    }

    get replicaNumber (): number {
        return this.tuples[this.length - 1].replicaNumber
    }

    get clock (): number {
        return this.tuples[this.length - 1].clock
    }

    get dot (): Dot {
        return {
            replicaNumber: this.replicaNumber,
            clock: this.clock,
        }
    }

    /**
     * Retrieve the offset of the last tuple of the identifier
     *
     * @return {number} The offset
     */
    get lastOffset (): number {
        return this.tuples[this.length - 1].offset
    }

    get base (): number[] {
        const result = this.tuples
        .reduce((acc: number[], tuple) => (
            acc.concat(tuple.asArray())
        ), [])
        result.pop() // remove last offset
        return result
    }

    /**
     * Retrieve the longest common prefix shared by this identifier with another one
     *
     * @param {Identifier} other The other identifier
     * @return {IdentifierTuple[]} The longest common prefix
     */
    longestCommonPrefix (other: Identifier): IdentifierTuple[] {
        const commonPrefix: IdentifierTuple[] = []
        const minLength = Math.min(this.tuples.length, other.tuples.length)
        let i = 0
        while (i < minLength && this.tuples[i].equals(other.tuples[i])) {
            commonPrefix.push(this.tuples[i])
            i++
        }
        return commonPrefix
    }

    /**
     * Retrieve the longest common base shared by this identifier with another one
     *
     * @param {Identifier} other The other identifier
     * @return {IdentifierTuple[]} The longest common base
     */
    longestCommonBase (other: Identifier): IdentifierTuple[] {
        const commonBase: IdentifierTuple[] = []
        const minLength = Math.min(this.tuples.length, other.tuples.length)

        let i = 0
        let stop = false
        while (!stop && i < minLength) {
            const tuple: IdentifierTuple = this.tuples[i]
            const otherTuple: IdentifierTuple = other.tuples[i]
            if (tuple.equals(otherTuple)) {
                commonBase.push(tuple)
            } else {
                stop = true
                if (tuple.equalsBase(otherTuple)) {
                    commonBase.push(tuple)
                }
            }
            i++
        }
        return commonBase
    }

    /**
     * Check if this identifier is a prefix of another one
     *
     * @param {Identifier} other The other identifier
     * @return {boolean} Is this identifier a prefix of other
     */
    isPrefix (other: Identifier): boolean {
        return this.isBasePrefix(other) &&
            this.lastOffset === other.tuples[this.length - 1].offset
    }

    /**
     * Check if the base of this identifier is a prefix of the other one
     *
     * @param {Identifier} other The other identifier
     * @return {boolean} Is this base a prefix of the other one
     */
    isBasePrefix (other: Identifier): boolean {
        return this.length <= other.length &&
            this.tuples.every((tuple: IdentifierTuple, index: number) => {
                const otherTuple: IdentifierTuple = other.tuples[index]
                if (index === this.tuples.length - 1) {
                    return tuple.equalsBase(otherTuple)
                }
                return tuple.equals(otherTuple)
            })
    }

    /**
     * Compute the common prefix between this identifier and the other one
     * and return its length
     *
     * @param other The other identifier
     * @return {number} The length of the common prefix
     */
    commonPrefixLength (other: Identifier): number {
        const minLength = Math.min(this.tuples.length, other.tuples.length)
        let i = 0
        while (i < minLength && this.tuples[i].equals(other.tuples[i])) {
            i++
        }
        return i
    }

    equals (other: Identifier): boolean {
        return this.equalsBase(other) &&
            this.lastOffset === other.lastOffset
    }

    /**
     * Check if two identifiers share the same base
     * Two identifiers share the same base if only the offset
     * of the last tuple of each identifier differs.
     *
     * @param {Identifier} other The other identifier
     * @return {boolean} Are the bases equals
     */
    equalsBase (other: Identifier): boolean {
        return this.length === other.length &&
            this.tuples.every((tuple: IdentifierTuple, index: number) => {
                const otherTuple: IdentifierTuple = other.tuples[index]
                if (index < this.length - 1) {
                    return tuple.equals(otherTuple)
                }
                return tuple.equalsBase(otherTuple)
            })
    }

    /**
     * Compare this identifier to another one to order them
     * Ordering.Less means that this is less than other
     * Ordering.Greater means that this is greater than other
     * Ordering.Equal means that this is equal to other
     *
     * @param {Identifier} other The identifier to compare
     * @return {Ordering} The order of the two identifier
     */
    compareTo (other: Identifier): Ordering {
        if (this.equals(other)) {
            return Ordering.Equal
        }
        if (this.isPrefix(other)) {
            return Ordering.Less
        }
        if (other.isPrefix(this)) {
            return Ordering.Greater
        }
        const index = this.commonPrefixLength(other)
        return this.tuples[index].compareTo(other.tuples[index])
    }

    /**
     * Check if we can generate new identifiers using
     * the same base as this without overflowing
     *
     * @param {number} length The number of characters we want to add
     * @return {boolean}
     */
    hasPlaceAfter (length: number): boolean {
        // Precondition: the node which contains this identifier must be appendableAfter()
        console.assert(isInt32(length), "length ∈ int32")
        console.assert(length > 0, "length > 0 ")

        // Prevent an overflow when computing lastOffset + length
        return this.lastOffset <= INT32_TOP - length
    }

    /**
     * Check if we can generate new identifiers using
     * the same base as this without underflowing
     *
     * @param {number} length The number of characters we want to add
     * @return {boolean}
     */
    hasPlaceBefore (length: number): boolean {
        // Precondition: the node which contains this identifier must be appendableBefore()
        console.assert(isInt32(length), "length ∈ int32")
        console.assert(length > 0, "length > 0 ")

        // Prevent an underflow when computing lastOffset - length
        return this.lastOffset >= INT32_BOTTOM + length
    }

    /**
     * Compute the offset of the last identifier we can generate using
     * the same base as this without overflowing on next
     *
     * @param {Identifier} next The next identifier
     * @param {number} max The desired offset
     * @return {number} The actual offset we can use
     */
    maxOffsetBeforeNext (next: Identifier, max: number): number {
        console.assert(isInt32(max), "max ∈ int32")
        console.assert(this.compareTo(next) === Ordering.Less, "this must be less than next")

        if (this.equalsBase(next)) {
            // Happen if we receive append/prepend operations in causal disorder
            console.assert(max < next.lastOffset, "max must be less than next.lastOffset")
            return max
        }
        if (this.isBasePrefix(next)) {
            // Happen if we receive split operations in causal disorder
            const offset = next.tuples[this.length - 1].offset
            return Math.min(offset, max)
        }
        // Bases differ
        return max
    }

    /**
     * Compute the offset of the last identifier we can generate using
     * the same base as this without underflowing on prev
     *
     * @param {Identifier} prev The previous identifier
     * @param {number} min The desired offset
     * @return {number} The actual offset we can use
     */
    minOffsetAfterPrev (prev: Identifier, min: number): number {
        console.assert(isInt32(min), "min ∈ int32")

        if (this.equalsBase(prev)) {
            // Happen if we receive append/prepend operations in causal disorder
            console.assert(min > prev.lastOffset,
                "min must be greater than prev.lastOffset")
            return min
        }
        if (this.isBasePrefix(prev)) {
            // Happen if we receive split operations in causal disorder
            const offset = prev.tuples[this.length - 1].offset
            return Math.max(offset + 1, min)
        }
        // Bases differ
        return min
    }

    digest (): number {
        return this.tuples.reduce((prev: number, tuple: IdentifierTuple) => {
            return (prev * 17 + tuple.digest()) | 0
        }, 0)
    }

    toString (): string {
        return "Id[" + this.tuples.join(",") + "]"
    }
}
