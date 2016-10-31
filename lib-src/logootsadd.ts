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

import {Identifier} from './identifier'
import {LogootSRopes} from './logootsropes'
import {TextInsert} from './textinsert'


/**
 * Represents a LogootSplit insert operation.
 */
export class LogootSAdd {

    /**
    * @constructor
    * @param {IdentifierInterval} id - the identifier that localise the insertion in the logoot sequence.
    * @param {string} l - the content of the block to be inserted.
    */
    constructor (id: {base: number[], last: number}, l: string) {
        // is is structurally an Identifier
        console.assert(typeof id === "object" &&
        id.base instanceof Array &&
        typeof id.last === "number", "id = ", id)
        console.assert(typeof l === "string", "l = ", l)

        this.id = Identifier.fromPlain(id) as Identifier // precondition
        this.l = l
    }

    static fromPlain (o: {id?: any, l?: any}): LogootSAdd | null {
        const plainId = o.id
        const l = o.l
        if (plainId instanceof Object && typeof l === "string") {
            const id = Identifier.fromPlain(plainId)
            if (id !== null) {
                return new LogootSAdd(id, l)
            } else {
                return null
            }
        } else {
            return null
        }
    }

    readonly id: Identifier

    readonly l: string

    /**
    * Apply the current insert operation to a LogootSplit document.
    * @param {LogootSRopes} doc - the LogootSplit document on which the operation wil be applied.
    * @return {TextInsert[]} the insertion to be applied on the sequence representing the document content.
    */
    execute (doc: LogootSRopes): TextInsert[] {
        return doc.addBlock(this.l, this.id)
    }

}

