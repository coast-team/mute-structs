/*
 *	Copyright 2016 Victorien Elvinger
 *
 *	This program is free software: you can redistribute it and/or modify
 *	it under the terms of the GNU General Public License as published by
 *	the Free Software Foundation, either version 3 of the License, or
 * 	(at your option) any later version.
 *
 *	This program is distributed in the hope that it will be useful,
 *	but WITHOUT ANY WARRANTY; without even the implied warranty of
 *	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *	GNU General Public License for more details.
 *
 *	You should have received a copy of the GNU General Public License
 *	along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import test from "ava"
import {AssertContext} from "ava"

import {
    INT32_BOTTOM,
    INT32_TOP
} from '../src/int32'
import {Identifier} from "../src/identifier"
import {IdentifierTuple} from "../src/identifiertuple"
import {Ordering} from "../src/ordering"

function equalsMacro (t: AssertContext,
    id1: Identifier, id2: Identifier, expected: boolean): void {

    const actual = id1.equals(id2)
    t.is(actual, expected)
}

function equalsBaseMacro (t: AssertContext,
    id1: Identifier, id2: Identifier, expected: boolean): void {

    const actual = id1.equalsBase(id2)
    t.is(actual, expected)
}

test("from-plain-factory", (t) => {
    const plainTuples = [{
        random: 42,
        replicaNumber: 1,
        clock: 10,
        offset: -5
    }, {
        random: 53,
        replicaNumber: 2,
        clock: 0,
        offset: 0
    }]
    const plain = {
        tuples: plainTuples
    }
    const id: Identifier | null = Identifier.fromPlain(plain)

    if (id === null) {
        t.fail("The identifier should have been correctly instantiated")
    } else {
        t.is(id.length, plain.tuples.length)

        id.tuples.forEach((actualTuple: IdentifierTuple, i: number) => {
            const expectedTuple = plain.tuples[i]

            t.is(actualTuple.random, expectedTuple.random)
            t.is(actualTuple.replicaNumber, expectedTuple.replicaNumber)
            t.is(actualTuple.clock, expectedTuple.clock)
            t.is(actualTuple.offset, expectedTuple.offset)
        })
    }
})

test("from-plain-factory-missing-property", (t) => {
    const plain = {}
    const id: Identifier | null = Identifier.fromPlain(plain)

    t.is(id, null)
})

test("from-plain-factory-wrong-type", (t) => {
    const plain = {
        tuples: [1, 2, 3, 4]
    }
    const id: Identifier | null = Identifier.fromPlain(plain)

    t.is(id, null)
})

const tuple00 = new IdentifierTuple(0, 0, 0, 0)
const tuple01 = new IdentifierTuple(0, 0, 0, 1)
const tuple11 = new IdentifierTuple(0, 0, 1, 1)

const id00 = new Identifier([tuple00])
const id00Twin = new Identifier([tuple00])
const id01 = new Identifier([tuple01])
const id11 = new Identifier([tuple11])
const id0001 = new Identifier([tuple00, tuple01])
const id0100 = new Identifier([tuple01, tuple00])

test("equals-twin", equalsMacro, id00, id00Twin, true)
test("equals-same-length", equalsMacro, id00, id11, false)
test("equals-different-length", equalsMacro, id00, id0001, false)

test("equalsBase-twin", equalsBaseMacro, id00, id00Twin, true)
test("equalsBase-same-base-same-length", equalsBaseMacro, id00, id01, true)
test("equalsBase-different-base-same-length", equalsBaseMacro, id00, id11, false)
test("equalsBase-is-prefix", equalsBaseMacro, id00, id0001, false)
test("equalsBase-different-base-different-length", equalsBaseMacro,
    id0001, id0100, false)


test("compare-to-last", (t) => {
    const id1 = new Identifier([new IdentifierTuple(0, 0, 0, 4)])
    const id1Twin = new Identifier([new IdentifierTuple(0, 0, 0, 4)])
    const id2 = new Identifier([new IdentifierTuple(0, 0, 0, 1)])
    const id3 = new Identifier([new IdentifierTuple(0, 0, 0, 9)])

    t.is(id1.compareTo(id1Twin), Ordering.Equal)
    t.not(id1.compareTo(id2), Ordering.Less)
    t.not(id1.compareTo(id3), Ordering.Greater)
})

test("compare-to-base", (t) => {
    const tuple0: IdentifierTuple = new IdentifierTuple(0, 0, 0, 0)
    const tuple1: IdentifierTuple = new IdentifierTuple(1, 0, 0, 0)
    const tuple2: IdentifierTuple = new IdentifierTuple(2, 0, 0, 0)
    const id01 = new Identifier([tuple0, tuple1])
    const id01Twin = new Identifier([tuple0, tuple1])
    const id012 = new Identifier([tuple0, tuple1, tuple2])
    const id0 = new Identifier([tuple0])
    const id02 = new Identifier([tuple0, tuple2])
    const id00 = new Identifier([tuple0, tuple0])

    t.is(id01.compareTo(id01Twin), Ordering.Equal)
    t.is(id01.compareTo(id012), Ordering.Less)
    t.is(id01.compareTo(id0), Ordering.Greater)
    t.is(id01.compareTo(id02), Ordering.Less)
    t.is(id01.compareTo(id00), Ordering.Greater)
})

test("hasPlaceAfter-max-last", (t) => {
    const tuple: IdentifierTuple = new IdentifierTuple(0, 0, 0, INT32_TOP - 1)
    const id = new Identifier([tuple])

    t.true(id.hasPlaceAfter(1))
    t.false(id.hasPlaceAfter(2))
})

test("hasPlaceBefore-min-last", (t) => {
    const tuple: IdentifierTuple = new IdentifierTuple(1, 0, 0, INT32_BOTTOM + 1)
    const id = new Identifier([tuple])

    t.true(id.hasPlaceBefore(1))
    t.false(id.hasPlaceBefore(2))
})

test("maxOffsetBeforeNext-same-base", (t) => {
    const tuple3: IdentifierTuple = new IdentifierTuple(0, 0, 0, 3)
    const tuple5: IdentifierTuple = new IdentifierTuple(0, 0, 0, 5)
    const id3 = new Identifier([tuple3])
    const id5 = new Identifier([tuple5])

    const expected = 4
    const actual = id3.maxOffsetBeforeNext(id5, 4)

    t.is(actual, expected)
})

test("maxOffsetBeforeNext-base-is-prefix", (t) => {
    const tuple03: IdentifierTuple = new IdentifierTuple(0, 0, 0, 3)
    const tuple05: IdentifierTuple = new IdentifierTuple(0, 0, 0, 5)
    const tuple10: IdentifierTuple = new IdentifierTuple(0, 0, 1, 0)
    const id03 = new Identifier([tuple03])
    const id0510 = new Identifier([tuple05, tuple10])

    const expected = 5
    const actual = id03.maxOffsetBeforeNext(id0510, 10)

    t.is(actual, expected)
})

test("minOffsetAfterPrev-same-base", (t) => {
    const tuple3: IdentifierTuple = new IdentifierTuple(0, 0, 0, 3)
    const tuple5: IdentifierTuple = new IdentifierTuple(0, 0, 0, 5)
    const id3 = new Identifier([tuple3])
    const id5 = new Identifier([tuple5])

    const expected = 4
    const actual = id5.minOffsetAfterPrev(id3, 4)

    t.is(actual, expected)
})

test("minOffsetAfterPrev-base-is-prefix", (t) => {
    const tuple03: IdentifierTuple = new IdentifierTuple(0, 0, 0, 3)
    const tuple05: IdentifierTuple = new IdentifierTuple(0, 0, 0, 5)
    const tuple10: IdentifierTuple = new IdentifierTuple(0, 0, 1, 0)
    const id0310 = new Identifier([tuple03, tuple10])
    const id05 = new Identifier([tuple05])

    const expected = 4
    const actual = id05.minOffsetAfterPrev(id0310, 0)

    t.is(actual, expected)
})
