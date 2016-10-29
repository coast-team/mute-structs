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
import {LogootSRopes} from './logootsropes'
import {TextDelete} from './textdelete'


const arrayConcat = Array.prototype.concat

/**
 * Represents a LogootSplit delete operation.
 */
export class LogootSDel {

    /**
    * @constructor
    * @param {IdentifierInterval[]} lid - the list of identifier that localise the deletion in the logoot sequence.
    */
    constructor(lid: Object[]) {
        console.assert(lid instanceof Array &&
        lid.every((item: any): boolean =>
            typeof item === "object" && item.hasOwnProperty("base") &&
            item.hasOwnProperty("begin") && item.hasOwnProperty("end")
        ), "lid = ", lid)

        this.lid = lid.map(IdentifierInterval.fromPlain) as IdentifierInterval[]
            // ASSERT: precondition
    }

    static fromPlain (o: {lid?: any}): LogootSDel | null {
        const plainLid = o.lid
        if (plainLid instanceof Array) {
            const lid = plainLid.map((a: any): IdentifierInterval | null => {
                if (a instanceof Object) {
                    return IdentifierInterval.fromPlain(a)
                } else {
                    return null
                }
            })

            if (lid.every((a: IdentifierInterval | null): boolean => a !== null)) {
                return new LogootSDel(lid as IdentifierInterval[])
                    // ASSERT: if condition
            } else {
                return null
            }
        } else {
            return null
        }
    }

    readonly lid: IdentifierInterval[]

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

