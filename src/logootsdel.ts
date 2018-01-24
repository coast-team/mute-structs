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

import {SafeAny} from "safe-any"

import {IdentifierInterval} from "./identifierinterval"
import {LogootSRopes} from "./logootsropes"
import {TextDelete} from "./textdelete"

const arrayConcat = Array.prototype.concat

/**
 * Represents a LogootSplit delete operation.
 */
export class LogootSDel {

    static fromPlain (o: SafeAny<LogootSDel>): LogootSDel | null {
        if (typeof o === "object" && o !== null) {
            const plainLid: SafeAny<IdentifierInterval[]> = o.lid
            if (plainLid instanceof Array && plainLid.length > 0) {
                let isOk = true
                let i = 0
                const lid: IdentifierInterval[] = []
                while (isOk && i < plainLid.length) {
                    const idi: IdentifierInterval | null = IdentifierInterval.fromPlain(plainLid[i])
                    if (idi !== null) {
                        lid.push(idi)
                    } else {
                        isOk = false
                    }
                    i++
                }
                if (isOk) {
                    return new LogootSDel(lid)
                }
            }
        }
        return null
    }

    readonly lid: IdentifierInterval[]

    /**
     * @constructor
     * @param {IdentifierInterval[]} lid - the list of identifier that localise the deletion in the logoot sequence.
     */
    constructor (lid: IdentifierInterval[]) {
        console.assert(lid.length > 0, "lid must not be empty")

        this.lid = lid
    }

    equals (aOther: LogootSDel): boolean {
        return this.lid.length === aOther.lid.length &&
            this.lid.every((idInterval: IdentifierInterval, index: number): boolean => {
                const otherIdInterval: IdentifierInterval = aOther.lid[index]
                return idInterval.equals(otherIdInterval)
            })
    }

    /**
     * Apply the current delete operation to a LogootSplit document.
     * @param {LogootSRopes} doc - the LogootSplit document on which the deletions wil be performed.
     * @return {TextDelete[]} the list of deletions to be applied on the sequence representing the document content.
     */
    execute (doc: LogootSRopes): TextDelete[] {
        return arrayConcat.apply([], this.lid.map(
            (aId: IdentifierInterval): TextDelete[] => doc.delBlock(aId)))
    }

}
