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
        console.assert(base.every((a: any) =>
            typeof a === "number" && Number.isInteger(a)),
            "Every items are integers. base = ", base)
        console.assert(typeof u === "number" && Number.isInteger(u), "u = ", u)

        this.base = base
        this.last = u
    }

    static fromPlain (o: {base?: any, last?: any}): Identifier | null {
        const base = o.base
        const last = o.last
        if (base instanceof Array && base.every((n: any) =>
                typeof n === "number" && Number.isInteger(n)) &&
            typeof last === "number" && Number.isInteger(last)) {

            return new Identifier(base, last)
        } else {
            return null
        }
    }

// Access
    readonly base: number[]

    readonly last: number

    compareTo (aOther: Identifier): -1 | 0 | 1 {
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

    /**
     * Check if the identifier's {@link Identifier#base} is equals to another identifier's one
     *
     * @param {Identifier} aOther The other identifier
     * @returns {boolean} Are the bases equals
     */
    equalsBase (aOther: Identifier): boolean {
      return this.base.length === aOther.base.length
        && this.base.every((value, index) => aOther.base[index] === value)
    }

    toString (): string {
        return "Id[" + this.base.concat(this.last).join(", ") + ']'
    }

    hasPlaceAfter (next: Identifier, length: number): boolean {
        console.assert(next instanceof Identifier, "next = ", next)
        console.assert(typeof length === "number", "length = ", length)

        const base = this.base

        if (base.length > next.base.length) {
          return true
        } else {
          const nextExtended = next.base.concat(next.last)
          const minLength = Math.min(base.length, nextExtended.length)

          let i = 0
          while (i < minLength && base[i] === nextExtended[i]) {
              i++
          }

          if (i !== minLength) {
            // Bases differ
            return true
          } else {
            const max = length + this.last
            return nextExtended[i] >= max
          }
        }
    }

    hasPlaceBefore (prev: Identifier, length: number): boolean {
        console.assert(prev instanceof Identifier, "prv = ", prev)
        console.assert(typeof length === "number" && Number.isInteger(length),
            "length = ", length)

        const base = this.base

        if (base.length > prev.base.length) {
          return true
        } else {
          const prevExtended = prev.base.concat(prev.last)
          const minLength = Math.min(base.length, prevExtended.length)

          let i = 0
          while (i < minLength && base[i] === prevExtended[i]) {
              i++
          }

          if (i !== minLength) {
            // Bases differ
            return true
          } else {
            const min = this.last - length
            return prevExtended[i] < min
          }
        }
    }

    minOffsetAfterPrev (prev: Identifier, min: number): number {
        console.assert(prev instanceof Identifier, "prev = ", prev)
        console.assert(typeof min === "number" && Number.isInteger(min),
            "min = ", min)

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

    maxOffsetBeforeNext (next: Identifier, max: number): number {
        console.assert(next instanceof Identifier, "next = ", next)
        console.assert(typeof max === "number" && Number.isInteger(max),
            "max = ", max)

        const base = this.base
        const nextExtended = next.base.concat(next.last)
        const minLength = Math.min(base.length, nextExtended.length)

        let i = 0
        while (i < minLength && base[i] === nextExtended[i]) {
            i++
        }

        if (i === minLength && i < nextExtended.length) {
            // base is a prefix of nextBase
            return Math.min(nextExtended[i], max)
        } else {
            return max
        }
    }

}
