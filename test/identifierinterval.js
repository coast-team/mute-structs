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
import IdentifierInterval from "../lib/identifierinterval.js"

test("from-plain-factory", (t) => {
    const plain = {
        base: [-1, 1, 8],
        begin: -5,
        end: 10,
    }
    const idi = IdentifierInterval.fromPlain(plain)

    t.deepEqual(idi, plain)
})

test("get-base-id", (t) => {
    const base = [-1, 1, 8]
    const lowerBound = -5
    const upperBound = 10
    const idi = new IdentifierInterval(base, lowerBound, upperBound)
    const index = 1
    const id = idi.getBaseId(index)

    t.is(id.last, index)
    t.deepEqual(id.base, base)
})

test("get-begin-id", (t) => {
    const base = [-1, 1, 8]
    const lowerBound = -5
    const upperBound = 10
    const idi = new IdentifierInterval(base, lowerBound, upperBound)
    const id = idi.getBeginId()

    t.is(id.last, lowerBound)
    t.deepEqual(id.base, base)
})

test("get-begin-id", (t) => {
    const base = [-1, 1, 8]
    const lowerBound = -5
    const upperBound = 10
    const idi = new IdentifierInterval(base, lowerBound, upperBound)
    const id = idi.getEndId()

    t.is(id.last, upperBound)
    t.deepEqual(id.base, base)
})

