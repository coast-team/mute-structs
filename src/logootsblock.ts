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
 *  but WITHOUT ANY WARRANTY without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with Mute-structs.  If not, see <http://www.gnu.org/licenses/>.
 */

import {IdentifierInterval} from './identifierinterval'


export class LogootSBlock {

// Creation
    constructor (id: IdentifierInterval, nbElt: number, mine = false) {
        console.assert(id instanceof IdentifierInterval, "id = ", id)
        console.assert(typeof nbElt === "number" && Number.isInteger(nbElt),
            "nbElt = ", "" + nbElt)
        console.assert(nbElt >= 0, "" + nbElt, ">= 0")
        console.assert(typeof mine === "boolean", "mine = " + mine)

        this.id = id
        this.nbElement = nbElt
        this.mine = mine
    }

    static mine (idi: IdentifierInterval, nbElt: number): LogootSBlock {
        return new LogootSBlock(idi, nbElt, true)
    }

    static foreign (idi: IdentifierInterval, nbElt: number): LogootSBlock {
        return new LogootSBlock(idi, nbElt, false)
    }

    static fromPlain (o: SafeAny<LogootSBlock>): LogootSBlock | null {
        if (typeof o === "object" && o !== null) {
            const plainId: SafeAny<IdentifierInterval> = o.id
            const nbElt: SafeAny<number> = o.nbElement
            if (plainId instanceof Object && typeof nbElt === "number" &&
                Number.isInteger(nbElt) && nbElt >= 0) {

                const id = IdentifierInterval.fromPlain(plainId)
                if (id !== null) {
                    return LogootSBlock.foreign(id, nbElt)
                        // FIXME: Always not mine?
                }
            }
        }
        return null
    }

// Access
    id: IdentifierInterval

    nbElement: number

    readonly mine: boolean

    addBlock (pos: number, length: number): void {
            console.assert(typeof pos === "number", "pos = " + pos)
            console.assert(typeof length === "number", "length = " + length)
            console.assert(length > 0, "" + length, "> 0")

        this.nbElement += length
        this.id = this.id.union(pos, pos + length - 1)
    }

    delBlock (begin: number, end: number, nbElement: number): void {
        console.assert(typeof begin === "number", "begin = " + begin)
        console.assert(typeof end === "number", "end = ", end)
        console.assert(typeof nbElement === "number", "nbElement = " + nbElement)
        console.assert(nbElement > 0, "" + nbElement, " > 0")

        this.nbElement -= nbElement
    }

    toString (): string {
        return '{' + this.nbElement + ',' + this.id.toString() + ', ' + (this.mine ? 'mine' : 'its') + '}'
    }

}
