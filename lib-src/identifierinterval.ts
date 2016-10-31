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

import {Identifier} from './identifier'


export class IdentifierInterval {

// Creation
    constructor (base: number[], begin: number, end: number) {
        console.assert(base instanceof Array, "base = ", base)
        console.assert(typeof begin === "number", "begin = ", begin)
        console.assert(typeof end === "number", "end = ", end)
        console.assert(begin <= end, "" + begin + " <= ", end)

        this.base = base
        this.begin = begin
        this.end = end
    }

    static fromPlain (o: {base?: any, begin?: any, end?: any}): IdentifierInterval | null {
        const base = o.base
        const begin = o.begin
        const end = o.end
        if (base instanceof Array && base.every((n: any) =>
                    typeof n === "number" && Number.isInteger(n)) &&
                typeof begin === "number" && typeof end === "number" &&
                Number.isInteger(begin) && Number.isInteger(end) &&
                begin <= end) {

            return new IdentifierInterval(base, begin, end)
        } else {
            return null
        }
    }

// Access
    readonly base: number[]

    readonly begin: number

    readonly end: number

    union (aBegin: number, aEnd: number): IdentifierInterval {
        const minBegin = Math.min(this.begin, aBegin)
        const maxEnd = Math.max(this.end, aEnd)

        return new IdentifierInterval(this.base, minBegin, maxEnd)
    }

    getBaseId (u: number): Identifier {
        console.assert(typeof u === "number", "u = ", u)

        return new Identifier(this.base, u)
    }

    getBeginId (): Identifier {
        return this.getBaseId(this.begin)
    }

    getEndId (): Identifier {
        return this.getBaseId(this.end)
    }

    toString (): string {
        return 'Id[' + this.base.join(",") + ', ' +
                this.begin + ' .. ' + this.end + ']'
    }

}

