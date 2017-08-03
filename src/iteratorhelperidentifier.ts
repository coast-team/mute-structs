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

export function compareBase (idInterval1: IdentifierInterval,
    idInterval2: IdentifierInterval): IdentifierIteratorResults {

    const b1 = idInterval1.base
    const begin1 = idInterval1.begin
    const end1 = idInterval1.end

    const b2 = idInterval2.base
    const begin2 = idInterval2.begin
    const end2 = idInterval2.end

    const minLength = Math.min(b1.length, b2.length)

    let i = 0
    while (i < minLength && b1[i] === b2[i]) {
        i++
    }

    if (i === minLength) {
        if (b1.length > minLength) { // b2 is shorter than b1
            const offset = b1[i]

            if (offset < begin2) {
                return IdentifierIteratorResults.B1_BEFORE_B2
            } else if (offset >= end2) {
                return IdentifierIteratorResults.B1_AFTER_B2
            } else {
                return IdentifierIteratorResults.B1_INSIDE_B2
            }
        } else if (b2.length > minLength) { // b1 is shorter than b2
            const offset = b2[i]

            if (offset < begin1) {
                return IdentifierIteratorResults.B1_AFTER_B2
            } else if (offset >= end1) {
                return IdentifierIteratorResults.B1_BEFORE_B2
            } else {
                return IdentifierIteratorResults.B2_INSIDE_B1
            }
        } else { // both bases are the same
            if (begin1 === begin2 && end1 === end2) {
                return IdentifierIteratorResults.B1_EQUALS_B2
            }
            else if ((end1 + 1) === begin2) {
                return IdentifierIteratorResults.B1_CONCAT_B2
            } else if (begin1 === (end2 + 1)) {
                return IdentifierIteratorResults.B2_CONCAT_B1
            } else if (end1 < begin2) {
                return IdentifierIteratorResults.B1_BEFORE_B2
            } else if (end2 < begin1 ) {
                return IdentifierIteratorResults.B1_AFTER_B2
            } else {
                /*
                    (B2 ⊂ B1) || (B1 ⊂ B2)  || (B1 ∩ B2 !== {})
                    It happens only in the following cases:
                        - An already applied operation is delivered again,
                        but the interval has since then been updated
                        (append, prepend, deletion at the bounds)
                        - It is a malicious operation which try to insert
                        again some identifiers
                    For now, do not do anything in both cases.
                */
                console.warn('Trying to duplicate existing identifiers: ',
                idInterval1, idInterval2)
                return IdentifierIteratorResults.B1_EQUALS_B2
            }
        }
    } else if (b1[i] > b2[i]) {
        return IdentifierIteratorResults.B1_AFTER_B2
    } else {
        return IdentifierIteratorResults.B1_BEFORE_B2
    }
}

