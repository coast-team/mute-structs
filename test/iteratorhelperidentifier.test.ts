/*
 *  Copyright 2017 Matthieu Nicolas
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import test from "ava"
import {AssertContext} from "ava"
import {IdentifierInterval} from "../src/identifierinterval"
import {
    compareBase,
    IdentifierIteratorResults
} from "../src/iteratorhelperidentifier"

function compareBaseMacro (t: AssertContext,
    idInterval1: IdentifierInterval, idInterval2: IdentifierInterval,
    expected: IdentifierIteratorResults): void {

    const actual: IdentifierIteratorResults =
        compareBase(idInterval1, idInterval2)
    t.is(actual, expected)
}

const base1 = [0, 0, 0]
const splitBase1 = [0, 0, 0, 4, 0, 0, 0]
const base2 = [42, 0, 0]

const base1From0To4: IdentifierInterval = new IdentifierInterval(base1, 0, 4)
const base1From0To5: IdentifierInterval = new IdentifierInterval(base1, 0, 5)
const base1From3To7: IdentifierInterval = new IdentifierInterval(base1, 3, 7)
const base1From6To10: IdentifierInterval = new IdentifierInterval(base1, 6, 10)
const base1From7To11: IdentifierInterval = new IdentifierInterval(base1, 7, 11)

const base2From0To5: IdentifierInterval = new IdentifierInterval(base2, 0, 5)
const base2From6To10: IdentifierInterval = new IdentifierInterval(base2, 6, 10)

const splitBase1At4From0To5: IdentifierInterval =
    new IdentifierInterval(splitBase1, 0, 5)

test("b1-before-b2-different-base", compareBaseMacro, base1From0To5, base2From0To5,
    IdentifierIteratorResults.B1_BEFORE_B2)
test("b1-before-b2-same-base", compareBaseMacro, base1From0To5, base1From7To11,
    IdentifierIteratorResults.B1_BEFORE_B2)
test("b1-before-b2-prefix", compareBaseMacro, base1From0To4, splitBase1At4From0To5,
    IdentifierIteratorResults.B1_BEFORE_B2)

test("b1-after-b2-different-base", compareBaseMacro, base2From0To5, base1From0To5,
    IdentifierIteratorResults.B1_AFTER_B2)
test("b1-after-b2-same-base", compareBaseMacro, base1From7To11, base1From0To5,
    IdentifierIteratorResults.B1_AFTER_B2)
test("b1-after-b2-suffix", compareBaseMacro, splitBase1At4From0To5, base1From0To4,
    IdentifierIteratorResults.B1_AFTER_B2)

test("b1-concat-b2", compareBaseMacro, base1From0To5, base1From6To10,
    IdentifierIteratorResults.B1_CONCAT_B2)
test("b2-concat-b1", compareBaseMacro, base1From6To10, base1From0To5,
    IdentifierIteratorResults.B2_CONCAT_B1)

test("b1-inside-b2", compareBaseMacro, splitBase1At4From0To5, base1From0To5,
    IdentifierIteratorResults.B1_INSIDE_B2)
test("b2-inside-b1", compareBaseMacro, base1From0To5, splitBase1At4From0To5,
    IdentifierIteratorResults.B2_INSIDE_B1)

test("b1-equals-b2", compareBaseMacro, base1From0To5, base1From0To5,
    IdentifierIteratorResults.B1_EQUALS_B2)

test("b1-overlap-b2", compareBaseMacro, base1From0To5, base1From3To7,
    IdentifierIteratorResults.B1_EQUALS_B2)
test("b1-included-in-b2", compareBaseMacro, base1From0To4, base1From0To5,
    IdentifierIteratorResults.B1_EQUALS_B2)
test("b2-included-in-b1", compareBaseMacro, base1From0To5, base1From0To4,
    IdentifierIteratorResults.B1_EQUALS_B2)
