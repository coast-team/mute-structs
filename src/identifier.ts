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
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with Mute-structs.  If not, see <http://www.gnu.org/licenses/>.
 */

import {SafeAny} from "safe-any"

import {Ordering} from './ordering'

/**
 * Holds the minimum value an integer can have.
 */
export const INT_32_MIN_VALUE = - 0x80000000

/**
 * Holds the maximum value an integer can have.
 */
export const INT_32_MAX_VALUE = 0x7fffffff

import {IdentifierTuple} from './identifiertuple'

export class Identifier {

// Creation
    constructor (tuples: IdentifierTuple[]) {
        console.assert(tuples.length > 0, "tuples must not be empty")

        this.tuples = tuples
    }

    static fromPlain (o: SafeAny<Identifier>): Identifier | null {
        if (typeof o === "object" && o !== null) {
            const plainTuples: SafeAny<IdentifierTuple[]> = o.tuples
            if (plainTuples instanceof Array && plainTuples.length > 0) {
                let isOk = true
                let i = 0
                const tuples: IdentifierTuple[] = []
                while (isOk && i < plainTuples.length) {
                    const tuple: IdentifierTuple | null = IdentifierTuple.fromPlain(plainTuples[i])
                    if (tuple !== null) {
                        tuples.push(tuple)
                    } else {
                        isOk = false
                    }
                    i++
                }
                if (isOk) {
                    return new Identifier(tuples)
                }
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
    static generateWithSameBase (id: Identifier, offset: number): Identifier {
        console.assert(Number.isInteger(offset), "offset must be an integer")
        console.assert(offset > INT_32_MIN_VALUE && offset <= INT_32_MAX_VALUE, "offset ∈ ]INT_32_MIN_VALUE, INT_32_MAX_VALUE]")

        const tuples: IdentifierTuple[] = id.tuples.map((tuple: IdentifierTuple, i: number) => {
            if (i === id.length - 1) {
                return IdentifierTuple.generateWithSameBase(tuple, offset)
            }
            return tuple
        })
        return new Identifier(tuples)
    }

// Access
    readonly tuples: IdentifierTuple[]

    /**
     * Shortcut to retrieve the length of the Identifier
     *
     * @return {number} The length
     */
    get length(): number {
        return this.tuples.length
    }

    /**
     * Retrieve the offset of the last tuple of the identifier
     *
     * @return {number} The offset
     */
    get lastOffset(): number {
        return this.tuples[this.length - 1].offset
    }

    /**
     * Retrieve the longest common prefix shared by this identifier with another one
     *
     * @param {Identifier} other The other identifier
     * @return {IdentifierTuple[]} The longest common prefix
     */
    getLongestCommonPrefix (other: Identifier): IdentifierTuple[] {
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
    getLongestCommonBase (other: Identifier): IdentifierTuple[] {
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
    getLengthCommonPrefix (other: Identifier): number {
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
        const index = this.getLengthCommonPrefix(other)
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
        console.assert(Number.isInteger(length), "length must be an integer")
        console.assert(length > 0, "length must be superior to 0 ")

        // Prevent an overflow when computing lastOffset + length
        return this.lastOffset <= INT_32_MAX_VALUE - length
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
        console.assert(Number.isInteger(length), "length must be an integer")
        console.assert(length > 0, "length must be superior to 0 ")

        // Prevent an underflow when computing lastOffset - length
        return this.lastOffset > INT_32_MIN_VALUE + length
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
        console.assert(Number.isInteger(max), "max must be an integer")
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
        console.assert(prev instanceof Identifier, "prev = ", prev)
        console.assert(typeof min === "number" && Number.isInteger(min),
            "min = ", min)

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
