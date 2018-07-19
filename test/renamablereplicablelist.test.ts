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
import {RenamableReplicableList} from "../src/renamablereplicablelist.js"

test("basic-insert-del-string", (t) => {
    const replicaNumberA = 1
    const docA = new RenamableReplicableList(replicaNumberA)
    const replicaNumberB = 2
    const docB = new RenamableReplicableList(replicaNumberB)

    const event1 = docA.insertLocal(0, "hello world")
    const event2 = docA.delLocal(6, 9)

    event1.execute(docB)
    event2.execute(docB)

    t.is(docA.str, docB.str, "docA.str = docB.str")
    t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test("local-rename", (t) => {
    const expectedStr = "hello world"
    const replicaNumberA = 1
    const docA = new RenamableReplicableList(replicaNumberA)

    docA.insertLocal(0, "helod")
    docA.delLocal(4, 5)
    docA.insertLocal(4, " world")
    docA.insertLocal(2, "l")

    docA.renameLocal()

    t.is(docA.str, expectedStr, `docA.str = ${expectedStr}`)
    t.is(docA.getNbBlocks(), 1, "docA.getNbBlocks() = 1")
})

test("basic-rename", (t) => {
    const replicaNumberA = 1
    const docA = new RenamableReplicableList(replicaNumberA)
    const replicaNumberB = 2
    const docB = new RenamableReplicableList(replicaNumberB)

    const event1 = docA.insertLocal(0, "helo")
    event1.execute(docB)
    const event2 = docB.insertLocal(4, " world")
    event2.execute(docA)
    const event3 = docA.insertLocal(2, "l")
    event3.execute(docB)

    const renameOp = docA.renameLocal()
    renameOp.execute(docB)

    t.is(docA.str, docB.str, "docA.str = docB.str")
    t.is(docA.getNbBlocks(), docB.getNbBlocks(), "docA.getNbBlocks() = docB.getNbBlocks()")
    t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})
