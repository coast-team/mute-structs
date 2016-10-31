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

import {LogootSRopes} from './logootsropes'
import {LogootSDel} from './logootsdel'


/**
 * Represents a sequence operation (deletion).
 */
export class TextDelete {

    /**
    * @constructor
    * @param {number} offset - the position of the first element to be deleted in the sequence.
    * @param {number} length - the length of the range to be deleted in the sequence.
    */
    constructor (offset: number, length: number) {
        console.assert(typeof offset === "number" && Number.isInteger(offset),
            "offset = ", offset)
        console.assert(typeof length === "number" && Number.isInteger(length),
            "length = ", length)
        console.assert(length > 0, "" + length + " > 0")

        this.offset = offset
        this.length = length
    }

    readonly offset: number

    readonly length: number

    /**
    * Apply the current delete operation to a LogootSplit document.
    * @param {LogootSDocument} doc - the LogootSplit document on which the deletion wil be performed.
    * @return {LogootSDel} the logootsplit deletion that is related to the deletion that has been performed.
    */
    applyTo (doc: LogootSRopes): LogootSDel {
        console.assert(doc instanceof LogootSRopes, "doc = ", doc)

        return doc.delLocal(this.offset, this.offset + this.length - 1)
    }

}

