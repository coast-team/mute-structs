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

import {Identifier} from "./identifier"
import {IdentifierInterval} from "./identifierinterval"
import {Ordering} from "./ordering"

export const enum IdentifierIteratorResults {
    B1_AFTER_B2,
    B1_BEFORE_B2,
    B1_INSIDE_B2,
    B2_INSIDE_B1,
    B1_CONCAT_B2,
    B2_CONCAT_B1,
    B1_EQUALS_B2,
}

export function compareBase (
    idInterval1: IdentifierInterval,
    idInterval2: IdentifierInterval): IdentifierIteratorResults {

    const id1: Identifier = idInterval1.idBegin
    const begin1 = idInterval1.begin
    const end1 = idInterval1.end

    const id2: Identifier = idInterval2.idBegin
    const begin2 = idInterval2.begin
    const end2 = idInterval2.end

    if (id1.equalsBase(id2)) {
        if (begin1 === begin2 && end1 === end2) {
            return IdentifierIteratorResults.B1_EQUALS_B2
        } else if ((end1 + 1) === begin2) {
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
            console.warn("Trying to duplicate existing identifiers: ",
            idInterval1, idInterval2)
            return IdentifierIteratorResults.B1_EQUALS_B2
        }
    }
    return compareIntervalsDifferentBases(idInterval1, idInterval2)
}

function compareIntervalsDifferentBases (
    idInterval1: IdentifierInterval,
    idInterval2: IdentifierInterval): IdentifierIteratorResults {

    const id1: Identifier = idInterval1.idBegin
    const id2: Identifier = idInterval2.idBegin
    console.assert(!id1.equalsBase(id2), "the bases of the ids must be different")

    if  (idInterval1.containsId(id2)) {
        return IdentifierIteratorResults.B2_INSIDE_B1
    }
    if (idInterval2.containsId(id1)) {
        return IdentifierIteratorResults.B1_INSIDE_B2
    }
    if (id1.compareTo(id2) === Ordering.Less) {
        return IdentifierIteratorResults.B1_BEFORE_B2
    }
    return IdentifierIteratorResults.B1_AFTER_B2
}
