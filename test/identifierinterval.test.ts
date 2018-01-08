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
import {Identifier} from "../src/identifier.js"
import {IdentifierInterval} from "../src/identifierinterval.js"
import {IdentifierTuple} from "../src/identifiertuple.js"

function generateIdInterval (begin: number, end: number): IdentifierInterval {
    const idBegin: Identifier =
        new Identifier([new IdentifierTuple(0, 0, 0, begin)])
    return new IdentifierInterval(idBegin, 5)
}

test("from-plain-factory", (t) => {
    const begin = 0
    const end = 5
    const tuples: IdentifierTuple[] =
        [new IdentifierTuple(42, 1, 10, -5), new IdentifierTuple(53, 2, 0, begin)]
    const idBegin: Identifier = new Identifier(tuples)
    const plain = {idBegin, end}
    const idInterval: IdentifierInterval | null = IdentifierInterval.fromPlain(plain)

    if (idInterval === null) {
      t.fail("The identifier interval should have been correctly instantiated")
    } else {
        t.true(idInterval.idBegin.equals(plain.idBegin))
        t.is(idInterval.begin, begin)
        t.is(idInterval.end, end)
        t.is(idInterval.length, end - begin + 1)
    }
})

test("getBaseId", (t) => {
    const begin = 0
    const end = 5
    const idInterval: IdentifierInterval = generateIdInterval(begin, end)

    const offset = 2
    const expectedId: Identifier =
        Identifier.fromBase(idInterval.idBegin, offset)
    const actualId = idInterval.getBaseId(offset)

    t.true(actualId.equals(expectedId))
})

test("union-prepend-only", (t: AssertContext) => {
    const begin = 0
    const end = 5
    const idInterval = generateIdInterval(begin, end)

    const aBegin = -5
    const aEnd = 2
    const unionInterval = idInterval.union(aBegin, aEnd)

    const expectedBegin = aBegin
    const expectedEnd = end

    t.is(unionInterval.begin, expectedBegin)
    t.is(unionInterval.end, expectedEnd)
})

test("union-append-only", (t: AssertContext) => {
    const begin = 0
    const end = 5
    const idInterval = generateIdInterval(begin, end)

    const aBegin = 2
    const aEnd = 10
    const unionInterval = idInterval.union(aBegin, aEnd)

    const expectedBegin = begin
    const expectedEnd = aEnd

    t.is(unionInterval.begin, expectedBegin)
    t.is(unionInterval.end, expectedEnd)
})

test("union-prepend-append", (t: AssertContext) => {
    const begin = 0
    const end = 5
    const idInterval = generateIdInterval(begin, end)

    const aBegin = -5
    const aEnd = 10
    const unionInterval = idInterval.union(aBegin, aEnd)

    const expectedBegin = aBegin
    const expectedEnd = aEnd

    t.is(unionInterval.begin, expectedBegin)
    t.is(unionInterval.end, expectedEnd)
})

test("union-no-changes", (t: AssertContext) => {
    const begin = 0
    const end = 5
    const idInterval = generateIdInterval(begin, end)

    const aBegin = 2
    const aEnd = 2
    const unionInterval = idInterval.union(aBegin, aEnd)

    const expectedBegin = begin
    const expectedEnd = end

    t.is(unionInterval.begin, expectedBegin)
    t.is(unionInterval.end, expectedEnd)
})
