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

import test from "ava"
import {AssertContext} from "ava"
import {Identifier} from "../src/identifier"
import {IdentifierInterval} from "../src/identifierinterval"
import {IdentifierTuple} from "../src/identifiertuple"
import {
    compareBase,
    IdentifierIteratorResults,
} from "../src/iteratorhelperidentifier"

function compareBaseMacro (
    t: AssertContext,
    idInterval1: IdentifierInterval, idInterval2: IdentifierInterval,
    expected: IdentifierIteratorResults): void {

    const actual: IdentifierIteratorResults =
        compareBase(idInterval1, idInterval2)
    t.is(actual, expected)
}

const tuple00: IdentifierTuple = new IdentifierTuple(0, 0, 0, 0)
const tuple04: IdentifierTuple = new IdentifierTuple(0, 0, 0, 4)
const tuple90: IdentifierTuple = new IdentifierTuple(9, 0, 0, 0)

const id00 = new Identifier([tuple00])
const id03 = Identifier.fromBase(id00, 3)
const id0400 = new Identifier([tuple04, tuple00])
const id06 = Identifier.fromBase(id00, 6)
const id07 = Identifier.fromBase(id00, 7)
const id90 = new Identifier([tuple90])
const id96 = Identifier.fromBase(id90, 6)

const id00To4: IdentifierInterval = new IdentifierInterval(id00, 4)
const id00To5: IdentifierInterval = new IdentifierInterval(id00, 5)
const id03To7: IdentifierInterval = new IdentifierInterval(id03, 7)
const id06To10: IdentifierInterval = new IdentifierInterval(id06, 10)
const id07To11: IdentifierInterval = new IdentifierInterval(id07, 11)

const id90To5: IdentifierInterval = new IdentifierInterval(id90, 5)
const id96To10: IdentifierInterval = new IdentifierInterval(id96, 10)

const id0400To5: IdentifierInterval =
    new IdentifierInterval(id0400, 5)

test("b1-before-b2-different-base", compareBaseMacro, id00To5, id90To5,
    IdentifierIteratorResults.B1_BEFORE_B2)
test("b1-before-b2-same-base", compareBaseMacro, id00To5, id07To11,
    IdentifierIteratorResults.B1_BEFORE_B2)
test("b1-before-b2-prefix", compareBaseMacro, id00To4, id0400To5,
    IdentifierIteratorResults.B1_BEFORE_B2)

test("b1-after-b2-different-base", compareBaseMacro, id90To5, id00To5,
    IdentifierIteratorResults.B1_AFTER_B2)
test("b1-after-b2-same-base", compareBaseMacro, id07To11, id00To5,
    IdentifierIteratorResults.B1_AFTER_B2)
test("b1-after-b2-suffix", compareBaseMacro, id0400To5, id00To4,
    IdentifierIteratorResults.B1_AFTER_B2)

test("b1-concat-b2", compareBaseMacro, id00To5, id06To10,
    IdentifierIteratorResults.B1_CONCAT_B2)
test("b2-concat-b1", compareBaseMacro, id06To10, id00To5,
    IdentifierIteratorResults.B2_CONCAT_B1)

test("b1-inside-b2", compareBaseMacro, id0400To5, id00To5,
    IdentifierIteratorResults.B1_INSIDE_B2)
test("b2-inside-b1", compareBaseMacro, id00To5, id0400To5,
    IdentifierIteratorResults.B2_INSIDE_B1)

test("b1-equals-b2", compareBaseMacro, id00To5, id00To5,
    IdentifierIteratorResults.B1_EQUALS_B2)

test("b1-overlap-b2", compareBaseMacro, id00To5, id03To7,
    IdentifierIteratorResults.B1_EQUALS_B2)
test("b1-included-in-b2", compareBaseMacro, id00To4, id00To5,
    IdentifierIteratorResults.B1_EQUALS_B2)
test("b2-included-in-b1", compareBaseMacro, id00To5, id00To4,
    IdentifierIteratorResults.B1_EQUALS_B2)
