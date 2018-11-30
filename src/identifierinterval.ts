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
import {Identifier} from "./identifier"
import {isInt32} from "./int32"
import {Ordering} from "./ordering"

/**
 * Define an interval between two identifiers sharing the same base
 */
export class IdentifierInterval {

    static fromPlain (o: unknown): IdentifierInterval | null {
        if (isObject<IdentifierInterval>(o) && isInt32(o.end)) {
            const idBegin = Identifier.fromPlain(o.idBegin)
            if (idBegin !== null && idBegin.lastOffset <= o.end) {
                return new IdentifierInterval(idBegin, o.end)
            }
        }
        return null
    }

// Access
    readonly idBegin: Identifier
    readonly end: number

// Creation
    constructor (idBegin: Identifier, end: number) {
        console.assert(isInt32(end), "end ∈ int32")
        console.assert(idBegin.lastOffset <= end, "idBegin must be less than or equal to idEnd")

        this.idBegin = idBegin
        this.end = end
    }

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

    get dot (): Dot {
        return this.idBegin.dot
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
        console.assert(isInt32(aBegin), "aBegin ∈ int32")
        console.assert(isInt32(aEnd), "aEnd ∈ int32")

        const minBegin = Math.min(this.begin, aBegin)
        const maxEnd = Math.max(this.end, aEnd)

        const newIdBegin: Identifier = Identifier.fromBase(this.idBegin, minBegin)

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
        console.assert(isInt32(offset), "offset ∈ int32")
        console.assert(this.begin <= offset && offset <= this.end,
            "offset must be included in the interval")

        return Identifier.fromBase(this.idBegin, offset)
    }

    digest (): number {
        // '| 0' converts to 32bits integer
        return (this.idBegin.digest() * 17 + this.end) | 0
    }

    toString (): string {
        return "IdInterval[" + this.idBegin.tuples.join(",") + " .. " + this.end + "]"
    }

}
