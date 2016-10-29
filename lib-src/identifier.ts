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

export class Identifier {

// Creation
    constructor (base: number[], u: number) {
        console.assert(base instanceof Array, "base = ", base)
        console.assert(typeof u === "number", "u = ", u)

        this.base = base
        this.last = u
    }

    static fromPlain (o: {base?: any, last?: any}): Identifier | null {
        const base = o.base
        const last = o.last
        if (base instanceof Array && base.every((n: any) =>
                typeof n === "number" && Number.isInteger(n)) &&
            Number.isInteger(last)) {

            return new Identifier(base, last)
        } else {
            return null
        }
    }

// Access
    readonly base: number[]

    readonly last: number

    compareTo (aOther: Identifier): 1 | 0 | -1 {
        console.assert(aOther instanceof Identifier, "aOther = ", aOther)

        const extended = this.base.concat(this.last)
        const otherExtended = aOther.base.concat(aOther.last)
        const minLength = Math.min(extended.length, otherExtended.length)

        let i = 0
        while (i < minLength && extended[i] === otherExtended[i]) {
            i++
        }

        if (i === minLength) {
            if (extended.length > minLength) {
                return 1
            } else if (otherExtended.length > minLength) {
                return -1
            } else {
                return 0
            }
        } else {
            if (extended[i] < otherExtended[i]) {
                return -1
            } else {
                return 1
            }
        }
    }

    toString (): string {
        return "Id[" + this.base.concat(this.last).join(", ") + ']'
    }

    copy (): Identifier {
        return new Identifier(this.base.slice(0), this.last)
    }

    hasPlaceAfter (next: Identifier, length: number): boolean {
        console.assert(next instanceof Identifier, "next = ", next)
        console.assert(typeof length === "number", "length = ", length)

        const max = length + this.last
        const base = this.base
        const nextExtended = next.base.concat(next.last)
        const minLength = Math.min(base.length, nextExtended.length)

        let i = 0
        while (i < minLength && base[i] === nextExtended[i]) {
            i++
        }

        return i === minLength &&
            (i >= nextExtended.length || nextExtended[i] >= max)
    }

    hasPlaceBefore (prev: Identifier, length: number): boolean {
            console.assert(prev instanceof Identifier, "prv = ", prev)
        console.assert(typeof length === "number", "length = ", length)

        const min = this.last - length
        const base = this.base
        const prevExtended = prev.base.concat(prev.last)
        const minLength = Math.min(base.length, prevExtended.length)

        let i = 0
        while (i < minLength && base[i] === prevExtended[i]) {
            i++
        }

        return i === minLength &&
            (i >= prevExtended.length || prevExtended[i] < min)
    }

    minOffsetAfterPrev (prev: Identifier, min: number): number {
            console.assert(prev instanceof Identifier, "prev = ", prev)
        console.assert(typeof min === "number", "min = ", min)

        const base = this.base
        const prevExtended = prev.base.concat(prev.last)
        const minLength = Math.min(base.length, prevExtended.length)

        let i = 0
        while (i < minLength && base[i] === prevExtended[i]) {
            i++
        }

        if (i === minLength && i < prevExtended.length) {
            // base is a prefix of prevBase
            return Math.max(prevExtended[i] + 1, min)
        } else {
            return min
        }
    }

    maxOffsetBeforeNex (next: Identifier, max: number): number {
            console.assert(next instanceof Identifier, "next = ", next)
        console.assert(typeof max === "number", "mex = ", max)

        const base = this.base
        const nextExtended = next.base.concat(next.last)
        const minLength = Math.min(base.length, nextExtended.length)

        let i = 0
        while (i < minLength && base[i] === nextExtended[i]) {
            i++
        }

        if (i === minLength && i < nextExtended.length) {
            // base is a prefix of nextBase
            return Math.max(nextExtended[i], max)
        } else {
            return max
        }
    }

}
