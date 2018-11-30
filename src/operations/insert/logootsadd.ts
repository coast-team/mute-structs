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

import {isObject} from "../../data-validation"
import {Identifier} from "../../identifier"
import {LogootSRopes} from "../../logootsropes"
import {LogootSOperation} from "../logootsoperation"
import {TextInsert} from "./textinsert"

class LogootSAddV1 {
    static fromPlain (o: unknown): LogootSAdd | null {
        if (isObject<LogootSAddV1>(o) &&
            typeof o.l === "string" && o.l.length > 0) {

            const id = Identifier.fromPlain(o.id)
            if (id !== null) {
                return new LogootSAdd(id, o.l)
            }
        }
        return null
    }

    readonly id?: Identifier
    readonly l?: string
}

/**
 * Represents a LogootSplit insert operation.
 */
export class LogootSAdd extends LogootSOperation {

    static fromPlain (o: unknown): LogootSAdd | null {
        if (isObject<LogootSAdd>(o) &&
            typeof o.content === "string" && o.content.length > 0) {

            const id = Identifier.fromPlain(o.id)
            if (id !== null) {
                return new LogootSAdd(id, o.content)
            }
        }
        // For backward compatibility
        // Allow to replay and update previous log of operations
        return LogootSAddV1.fromPlain(o)
    }

    readonly id: Identifier
    readonly content: string

    get author (): number {
        return this.id.replicaNumber
    }

    /**
     * @constructor
     * @param {Identifier} id - the identifier that localise the insertion in the logoot sequence.
     * @param {string} content - the content of the block to be inserted.
     */
    constructor (id: Identifier, content: string) {
        console.assert(content.length > 0, "content must not be empty")

        super()
        this.id = id
        this.content = content
    }

    equals (aOther: LogootSAdd): boolean {
        return this.id.equals(aOther.id) &&
            this.content === aOther.content
    }

    /**
     * Apply the current insert operation to a LogootSplit document.
     * @param {LogootSRopes} doc - the LogootSplit document on which the operation wil be applied.
     * @return {TextInsert[]} the insertion to be applied on the sequence representing the document content.
     */
    execute (doc: LogootSRopes): TextInsert[] {
        return doc.addBlock(this.content, this.id)
    }

}
