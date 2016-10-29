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
    constructor (id: IdentifierInterval, list: number) {
        console.assert(id instanceof IdentifierInterval, "id = ", id)
        console.assert(typeof list === "number", "list = ", "" + list)
        console.assert(list >= 0, "" + list, ">= 0")

        this.id = id
        this.nbElement = list
        this.mine = false
    }

    static fromPlain (o: {id?: Object | null, nbElement?: number}): LogootSBlock | null {
        const plainId = o.id
        const nbElt = o.nbElement
        if (plainId instanceof Object && typeof nbElt === "number" &&
            Number.isInteger(nbElt) && nbElt >= 0) {

            const id = IdentifierInterval.fromPlain(plainId)
            if (id !== null) {
                return new LogootSBlock(id, nbElt)
            } else {
                return null
            }
        } else {
            return null
        }
    }

// Access
    readonly id: IdentifierInterval

    nbElement: number

    mine: boolean

    addBlock (pos: number, length: number): void {
            console.assert(typeof pos === "number", "pos = " + pos)
            console.assert(typeof length === "number", "length = " + length)
            console.assert(length > 0, "" + length, "> 0")

        this.nbElement += length
        this.id.begin = Math.min(this.id.begin, pos)
        this.id.end = Math.max(this.id.end, pos + length - 1)
    }

    delBlock (begin: number, end: number, nbElement: number): void {
        console.assert(typeof begin === "number", "begin = " + begin)
        console.assert(typeof end === "number", "end = ", end)
        console.assert(typeof nbElement === "number", "nbElement = " + nbElement)
        console.assert(nbElement > 0, "" + nbElement, " > 0")

        this.nbElement -= nbElement
    }

    copy (): LogootSBlock {
        return new LogootSBlock(this.id.copy(), this.nbElement)
    }

    toString (): string {
        return '{' + this.nbElement + ',' + this.id.toString() + ', ' + (this.mine ? 'mine' : 'its') + '}'
    }

}
