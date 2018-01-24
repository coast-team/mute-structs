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

import {isInt32} from "./int32"
import {LogootSAdd} from "./logootsadd"
import {LogootSRopes} from "./logootsropes"

/**
 * Represents a sequence operation (insert).
 */
export class TextInsert {

    readonly offset: number

    readonly content: string

    /**
     * @constructor
     * @param {number} offset - the insertion position in the sequence.
     * @param {string} content - the content to be inserted in the sequence.
     */
    constructor (offset: number, content: string) {
        console.assert(isInt32(offset), "offset ∈ int32")

        this.offset = offset
        this.content = content
    }

    equals (other: TextInsert): boolean {
        return this.offset === other.offset &&
            this.content === other.content
    }

    /**
     * Apply the current insert operation to a LogootSplit document.
     * @param {LogootSDocument} doc - the LogootSplit document on which the insertion wil be performed.
     * @return {LogootSAdd} the logootsplit insertion that is related to the insertion that has been performed.
     */
    applyTo (doc: LogootSRopes): LogootSAdd {
        return doc.insertLocal(this.offset, this.content)
    }

}
