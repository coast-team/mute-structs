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
import Identifier from "../lib/identifier.js"
import IdFactory from "../lib/idfactory.js"

test("two-contiguous-bases", (t) => {
    const replicaNumber = 1
    const clock = 5
    const id1 = new Identifier([], 1)
    const id2 = new Identifier([], 4)
    const newBase = IdFactory.createBetweenPosition(id1, id2,
        replicaNumber, clock)
    const newId = new Identifier(newBase, 0)

    t.is(id1.compareTo(newId), -1, "id1 < newId")
    t.is(newId.compareTo(id2), -1, "newId < id2")
    t.is(newBase[0], 2)
})

