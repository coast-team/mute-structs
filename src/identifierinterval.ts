/*
 *  Copyright 2014 Matthieu Nicolas, Victorien Elvinger
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

import {SafeAny} from "safe-any"

import {Identifier} from './identifier'
import {Ordering} from './ordering'

/**
 * Define an interval between two identifiers sharing the same base
 */
export class IdentifierInterval {

// Creation
    constructor (idBegin: Identifier, end: number) {
        console.assert(Number.isInteger(end), "end must be an integer")
        console.assert(idBegin.lastOffset <= end, "idBegin must be less than or equal to idEnd")

        this.idBegin = idBegin
        this.end = end
    }

    static fromPlain (o: SafeAny<IdentifierInterval>): IdentifierInterval | null {
        if (typeof o === "object" && o !== null) {
            const idBegin: Identifier | null = Identifier.fromPlain(o.idBegin)
            if (idBegin !== null && typeof o.end === "number" &&
                Number.isInteger(o.end) && idBegin.lastOffset <= o.end) {

                return new IdentifierInterval(idBegin, o.end)
            }
        }
        return null
    }

// Access
    readonly idBegin: Identifier
    readonly end: number

    /**
     * Shortcut to retrieve the offset of the last tuple of idBegin
     * This offset also corresponds to the beginning of the interval
     *
     * @return {number} The offset
     */
    get begin (): number {
        return this.idBegin.lastOffset
    }

    /**
     * Shortcut to retrieve the last identifier of the interval
     *
     * @return {Identifier} The last identifier of the interval
     */
    get idEnd (): Identifier {
        return this.getBaseId(this.end)
    }

    /**
     * Shortcut to compute the length of the interval
     *
     * @return {number} The length
     */
    get length (): number {
        return this.end - this.begin + 1
    }

    get base (): number[] {
        return this.idBegin.base
    }

    equals (aOther: IdentifierInterval): boolean {
        return this.idBegin.equals(aOther.idBegin) &&
            this.begin === aOther.begin && this.end === aOther.end
    }

    /**
     * Compute the union between this interval and [aBegin, aEnd]
     *
     * @param {number} aBegin
     * @param {number} aEnd
     * @return {IdentifierInterval} this U [aBegin, aEnd]
     */
    union (aBegin: number, aEnd: number): IdentifierInterval {
        console.assert(Number.isInteger(aBegin), "aBegin must be an integer")
        console.assert(Number.isInteger(aEnd), "aEnd must be an integer")

        const minBegin = Math.min(this.begin, aBegin)
        const maxEnd = Math.max(this.end, aEnd)

        const newIdBegin: Identifier = Identifier.generateWithSameBase(this.idBegin, minBegin)

        return new IdentifierInterval(newIdBegin, maxEnd)
    }

    /**
     * Check if the provided identifier belongs to this interval
     *
     * @param {Identifier} id
     * @return {boolean} Does the identifier belongs to this interval
     */
    containsId (id: Identifier): boolean {
        return this.idBegin.compareTo(id) === Ordering.Less &&
            this.idEnd.compareTo(id) === Ordering.Greater
    }

    /**
     * Retrieve a identifier from the interval from its offset
     *
     * @param {number} offset The offset of the identifier
     * @return {Identifier} The identifier
     */
    getBaseId (offset: number): Identifier {
        console.assert(Number.isInteger(offset), "offset must be an integer")
        console.assert(this.begin <= offset && offset <= this.end, "offset must be included in the interval")

        return Identifier.generateWithSameBase(this.idBegin, offset)
    }

    digest (): number {
        // '| 0' converts to 32bits integer
        return (this.idBegin.digest() * 17 + this.end) | 0
    }

    toString (): string {
        return "IdInterval[" + this.idBegin.tuples.join(",") + " .. " + this.end + "]"
    }

}
