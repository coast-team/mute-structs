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

    equals (aOther: Identifier): boolean {
        return this.equalsBase(aOther) && this.last === aOther.last
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
        // Cannot have the same base if sizes are different
        if (this.length !== other.length) {
            return false
        }

        const commonPrefix: IdentifierTuple[] = this.getLongestCommonPrefix(other)
        const lastIndex = this.length - 1

        return commonPrefix.length === lastIndex &&
            this.tuples[lastIndex].equalsBase(other.tuples[lastIndex])
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
        const minLength = Math.min(this.length, other.length)
        const commonPrefix: IdentifierTuple[] = this.getLongestCommonPrefix(other)

        if (commonPrefix.length === minLength) {
            if (this.length < other.length) {
                return Ordering.Less // this ⊂ other
            }
            if (other.length < this.length) {
                return Ordering.Greater // other ⊂ this
            }
            return Ordering.Equal // this == other
        }
        const tuple: IdentifierTuple = this.tuples[commonPrefix.length]
        const otherTuple: IdentifierTuple = other.tuples[commonPrefix.length]

        return tuple.compareTo(otherTuple)
    }

    /**
     * Check if we can generate new identifiers using
     * the same base as this without overflowing on next
     *
     * @param {Identifier} next The next identifier
     * @param {number} length The number of characters we want to add
     * @return {boolean}
     */
    hasPlaceAfter (next: Identifier, length: number): boolean {
        console.assert(Number.isInteger(length), "length must be an integer")
        console.assert(length > 0, "length must be superior to 0 ")
        console.assert(this.compareTo(next) === Ordering.Less, "this must be less than next")

        if (this.lastOffset > INT_32_MAX_VALUE - length) {
            // Prevent an overflow when computing offset + length
            return false
        } else if (this.length > next.length) {
            return true
        } else {
            const commonBase: IdentifierTuple[] = this.getLongestCommonBase(next)

            if (commonBase.length !== this.length) {
                // Bases differ
                return true
            } else {
                // The base of this identifier is a prefix of the one of next
                const max = this.lastOffset + length
                const nextOffset = next.tuples[this.length - 1].offset
                if (this.length < next.length) {
                    return nextOffset >= max
                }
                return  nextOffset > max
            }
        }
    }

    /**
     * Check if we can generate new identifiers using
     * the same base as this without underflowing on prev
     *
     * @param {Identifier} prev The previous identifier
     * @param {number} length The number of characters we want to add
     * @return {boolean}
     */
    hasPlaceBefore (prev: Identifier, length: number): boolean {
        console.assert(Number.isInteger(length), "length must be an integer")
        console.assert(length > 0, "length must be superior to 0 ")
        console.assert(this.compareTo(prev) === Ordering.Greater, "this must be greater than prev")

        if (this.lastOffset <= INT_32_MIN_VALUE + length) {
            // Prevent an underflow when computing offset - length
            return false
        }
        else if (this.length > prev.length) {
            return true
        } else {
            const commonBase: IdentifierTuple[] = this.getLongestCommonBase(prev)

            if (commonBase.length !== this.length) {
                // Bases differ
                return true
            } else {
                // The base of this identifier is a prefix of the one of prev
                const min = this.lastOffset - length
                return prev.tuples[this.length - 1].offset < min
            }
        }
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

        const commonBase: IdentifierTuple[] = this.getLongestCommonBase(next)
        if (commonBase.length !== this.length) {
            // Bases differ
            return max
        } else {
            // The base of this identifier is a prefix of the one of next
            const nextOffset = next.tuples[this.length - 1].offset
            if (this.length < next.length) {
                return Math.min(nextOffset, max)
            }
            return Math.min(nextOffset - 1, max)
        }
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

        const commonBase: IdentifierTuple[] = this.getLongestCommonBase(prev)
        if (commonBase.length !== this.length) {
            // Bases differ
            return min
        } else {
            // The base of this identifier is a prefix of the one of next
            return Math.max(prev.tuples[this.length - 1].offset + 1, min)
        }
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
