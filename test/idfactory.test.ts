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
import {Identifier} from "../src/identifier.js"
import {IdentifierTuple} from "../src/identifiertuple.js"
import {Ordering} from "../src/ordering.js"

import {createBetweenPosition} from "../src/idfactory.js"

test("two-noncontiguous-bases", (t: AssertContext) => {
    const replicaNumber = 0
    const clock = 1
    const id1: Identifier = new Identifier([new IdentifierTuple(0, replicaNumber, clock - 1, 0)])
    const id2: Identifier = new Identifier([new IdentifierTuple(42, 0, 0, 0)])

    const newId: Identifier = createBetweenPosition(id1, id2, replicaNumber, clock)

    t.is(id1.compareTo(newId), Ordering.Less)
    t.is(newId.compareTo(id2), Ordering.Less)
})

test("two-contiguous-bases", (t: AssertContext) => {
    const replicaNumber = 0
    const clock = 1
    const tuple: IdentifierTuple = new IdentifierTuple(0, replicaNumber, clock - 1, 0)
    const id1: Identifier = new Identifier([tuple])
    const id2: Identifier = new Identifier([new IdentifierTuple(1, 0, 0, 0)])

    const newId: Identifier = createBetweenPosition(id1, id2, replicaNumber, clock)

    t.is(id1.compareTo(newId), Ordering.Less)
    t.is(newId.compareTo(id2), Ordering.Less)
    t.is(newId.length, id1.length + 1)
    t.true(id1.isPrefix(newId))
})
