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
import {Identifier, INT_32_MIN_VALUE, INT_32_MAX_VALUE} from "../lib/identifier.js"

test("from-plain-factory", (t) => {
    const plain = {
        base: [-1, 1, 8],
        last: 0,
    }
    const id = Identifier.fromPlain(plain)

    t.deepEqual(id, plain)
})

test("compare-to-last", (t) => {
    const id1 = new Identifier([], 4)
    const id1Twin = new Identifier([], 4)
    const id2 = new Identifier([], 1)
    const id3 = new Identifier([], 9)

    t.is(id1.compareTo(id1Twin), 0)
    t.not(id1.compareTo(id2), -1)
    t.not(id1.compareTo(id3), 1)
})

test("compare-to-base", (t) => {
    const last = 0
    const id1 = new Identifier([1, 2], last)
    const id1Twin = new Identifier([1, 2], last)
    const id2 = new Identifier([1, 2, 3], last)
    const id3 = new Identifier([1], last)
    const id4 = new Identifier([1, 3], last)
    const id5 = new Identifier([1, 1], last)

    t.is(id1.compareTo(id1Twin), 0)
    t.not(id1.compareTo(id2), 1)
    t.not(id1.compareTo(id3), -1)
    t.not(id1.compareTo(id4), 1)
    t.not(id1.compareTo(id5), -1)
})

test("hasPlaceAfter-same-base", (t) => {
    const id1 = new Identifier([], 0)
    const id2 = new Identifier([], 1)

    t.true(id1.hasPlaceAfter(id2, 1))
    t.false(id1.hasPlaceAfter(id2, 2))

    t.false(id1.hasPlaceAfter(id1, 1))
    t.false(id2.hasPlaceAfter(id1, 1))
})

test("hasPlaceAfter-max-last", (t) => {
    const id1 = new Identifier([0, 0, 0], INT_32_MAX_VALUE - 1)
    const id2 = new Identifier([1, 1, 0], 0)

    t.true(id1.hasPlaceAfter(id2, 1))
    t.false(id1.hasPlaceAfter(id2, 2))
})

test("hasPlaceBefore-same-base", (t) => {
    const id1 = new Identifier([], 0)
    const id2 = new Identifier([], 1)
    const id3 = new Identifier([], 2)

    t.true(id3.hasPlaceBefore(id1, 1))
    t.false(id3.hasPlaceBefore(id1, 2))

    t.false(id1.hasPlaceBefore(id1, 1))
    t.false(id2.hasPlaceBefore(id1, 1))
})

test("hasPlaceBefore-min-last", (t) => {
    const id1 = new Identifier([0, 0, 0], 0)
    const id2 = new Identifier([1, 0, 0], INT_32_MIN_VALUE + 2)

    t.true(id2.hasPlaceBefore(id1, 1))
    t.false(id2.hasPlaceBefore(id1, 2))
})

test.failing("maxOffsetBeforeNext-same-base", (t) => {
  const id1 = new Identifier([0, 0, 0], 3)
  const id2 = new Identifier([0, 0, 0], 5)

  const expected = 4
  const actual = id1.maxOffsetBeforeNext(id2, 10)

  t.is(actual, expected)
})

test("maxOffsetBeforeNext-base-is-prefix", (t) => {
  const id1 = new Identifier([0, 0, 0], 3)
  const id2 = new Identifier([0, 0, 0, 5, 0, 0, 1], 0)

  const expected = 5
  const actual = id1.maxOffsetBeforeNext(id2, 10)

  t.is(actual, expected)
})

test("minOffsetAfterPrev-same-base", (t) => {
  const id1 = new Identifier([0, 0, 0], 3)
  const id2 = new Identifier([0, 0, 0], 5)

  const expected = 4
  const actual = id2.minOffsetAfterPrev(id1, 0)

  t.is(actual, expected)
})

test("minOffsetAfterPrev-base-is-prefix", (t) => {
  const id1 = new Identifier([0, 0, 0, 3, 0, 0, 1], 0)
  const id2 = new Identifier([0, 0, 0], 5)

  const expected = 4
  const actual = id2.minOffsetAfterPrev(id1, 0)

  t.is(actual, expected)
})
