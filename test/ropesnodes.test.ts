/*
 * Copyright 2017 Victorien Elvinger
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import test from "ava"
import {Identifier} from "../src/identifier.js"
import {IdentifierInterval} from "../src/identifierinterval.js"
import {IdentifierTuple} from "../src/identifiertuple.js"
import {LogootSBlock} from "../src/logootsblock.js"
import {RopesNodes} from "../src/ropesnodes.js"

test("matching-linear-representation", (t) => {
    const tuple03 = new IdentifierTuple(0, 0, 0, 3)
    const tuple50 = new IdentifierTuple(5, 0, 0, 0)
    const tuple80 = new IdentifierTuple(8, 0, 0, 0)

    const id03 = new Identifier([tuple03])
    const id50 = new Identifier([tuple50])
    const id5080 = new Identifier([tuple50, tuple80])

    const idi1 = new IdentifierInterval(id03, 5)
    const idi2 = new IdentifierInterval(id50, 5)
    const idi3 = new IdentifierInterval(id5080, 5)

    const block1 = new LogootSBlock(idi1, 5)
    const block2 = new LogootSBlock(idi2, 5)
    const block3 = new LogootSBlock(idi3, 5)
    const tree1 = new RopesNodes(block2, 0, 5,
        RopesNodes.leaf(block1, 0, 5),
        RopesNodes.leaf(block3, 0, 5))
    const tree2 = new RopesNodes(block1, 0, 5, null,
        new RopesNodes(block2, 0, 5, null,
             RopesNodes.leaf(block3, 0, 5)))
    const tree3 = new RopesNodes(block3, 0, 5,
         new RopesNodes(block2, 0, 5,
             RopesNodes.leaf(block1, 0, 5), null), null)
    const tree4 = new RopesNodes(block3, 0, 5,
        new RopesNodes(block1, 0, 5, null,
            RopesNodes.leaf(block2, 0, 5)), null)
    const tree5 = new RopesNodes(block1, 0, 5, null,
        new RopesNodes(block3, 0, 5,
            RopesNodes.leaf(block2, 0, 5), null))
    const list1 = tree1.toList()
    const list2 = tree2.toList()
    const list3 = tree3.toList()
    const list4 = tree4.toList()
    const list5 = tree5.toList()

    t.deepEqual(list2, list1)
    t.deepEqual(list3, list1)
    t.deepEqual(list4, list1)
    t.deepEqual(list5, list1)
})
