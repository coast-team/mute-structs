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

import {SafeAny} from "safe-any"

import {IdentifierInterval} from './identifierinterval'


export class LogootSBlock {

// Creation
    constructor (idInterval: IdentifierInterval, nbElt: number, mine = false) {
        console.assert(Number.isInteger(nbElt) && nbElt >= 0, "nbElt must be a positive integer")

        this.idInterval = idInterval
        this.nbElement = nbElt
        this.mine = mine
    }

    static mine (idInterval: IdentifierInterval, nbElt: number): LogootSBlock {
        return new LogootSBlock(idInterval, nbElt, true)
    }

    static foreign (idInterval: IdentifierInterval, nbElt: number): LogootSBlock {
        return new LogootSBlock(idInterval, nbElt, false)
    }

    static fromPlain (o: SafeAny<LogootSBlock>): LogootSBlock | null {
        if (typeof o === "object" && o !== null) {
            const plainId: SafeAny<IdentifierInterval> = o.idInterval
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
    idInterval: IdentifierInterval

    nbElement: number

    readonly mine: boolean

    addBlock (pos: number, length: number): void {
        console.assert(Number.isInteger(length) && length > 0, "length must be a positive integer")

        this.nbElement += length
        this.idInterval = this.idInterval.union(pos, pos + length - 1)
    }

    delBlock (nbElt: number): void {
        console.assert(Number.isInteger(nbElt) && nbElt > 0, "nbElt must be a positive integer")

        this.nbElement -= nbElt
    }

    toString (): string {
        return '{' + this.nbElement + ',' + this.idInterval.toString() + ', ' + (this.mine ? 'mine' : 'its') + '}'
    }

}
