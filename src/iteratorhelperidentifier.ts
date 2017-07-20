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


export const enum IdentifierIteratorResults {
        B1_AFTER_B2,
        B1_BEFORE_B2,
        B1_INSIDE_B2,
        B2_INSIDE_B1,
        B1_CONCAT_B2,
        B2_CONCAT_B1,
        B1_EQUALS_B2
}

export class IteratorHelperIdentifier {

    constructor (id1: IdentifierInterval, id2: IdentifierInterval) {
        console.assert(id1 instanceof IdentifierInterval, "id1 = ", id1)
        console.assert(id2 instanceof IdentifierInterval, "id2 = ", id2)

        this.id1 = id1
        this.id2 = id2
        this.nextOffset = -1
    }

    readonly id1: IdentifierInterval

    readonly id2: IdentifierInterval

    nextOffset: number

    compareBase (): IdentifierIteratorResults {
        const b1 = this.id1.base
        const b2 = this.id2.base
        const minLength = Math.min(b1.length, b2.length)

        let i = 0
        while (i < minLength && b1[i] === b2[i]) {
            i++
        }

        if (i === minLength) {
            if (b1.length > minLength) { // b2 is shorter than b1
                this.nextOffset = b1[i]

                if (this.nextOffset < this.id2.begin) {
                    return IdentifierIteratorResults.B1_BEFORE_B2
                } else if (this.nextOffset >= this.id2.end) {
                    return IdentifierIteratorResults.B1_AFTER_B2
                } else {
                    return IdentifierIteratorResults.B1_INSIDE_B2
                }
            } else if (b2.length > minLength) { // b1 is shorter than b2
                this.nextOffset = b2[i]

                if (this.nextOffset < this.id1.begin) {
                    return IdentifierIteratorResults.B1_AFTER_B2
                } else if (this.nextOffset >= this.id1.end) {
                    return IdentifierIteratorResults.B1_BEFORE_B2
                } else {
                    return IdentifierIteratorResults.B2_INSIDE_B1
                }
            } else { // both bases are the same
                if (this.id1.begin === this.id2.begin && this.id1.end === this.id2.end) {
                  return IdentifierIteratorResults.B1_EQUALS_B2
                }
                else if ((this.id1.end + 1) === this.id2.begin) {
                    return IdentifierIteratorResults.B1_CONCAT_B2
                } else if (this.id1.begin === (this.id2.end + 1)) {
                    return IdentifierIteratorResults.B2_CONCAT_B1
                } else if (this.id1.end < this.id2.begin) {
                    return IdentifierIteratorResults.B1_BEFORE_B2
                } else if (this.id2.end < this.id1.begin ) {
                    return IdentifierIteratorResults.B1_AFTER_B2
                } else {
                  // This case should not occur
                  // Only malicious users would generate such operations
                  console.warn('IteratorHelperIdentifier.compareBase: ', this.id1, this.id2)
                  return IdentifierIteratorResults.B1_EQUALS_B2
                }
            }
        } else if (b1[i] > b2[i]) {
            return IdentifierIteratorResults.B1_AFTER_B2
        } else {
            return IdentifierIteratorResults.B1_BEFORE_B2
        }
    }

}
