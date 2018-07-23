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

test("rename-then-concurrent-insert", (t) => {
    const replicaNumberA = 1
    const docA = new RenamableReplicableList(replicaNumberA)
    const replicaNumberB = 2
    const docB = new RenamableReplicableList(replicaNumberB)

    const event1 = docA.insertLocal(0, "helo")
    event1.execute(docB)
    const event2 = docB.insertLocal(4, " wor")
    event2.execute(docA)
    const event3 = docA.insertLocal(8, "ld")
    event3.execute(docB)

    docA.renameLocal()
    const concurrentInsert = docB.insertLocal(2, "l")

    concurrentInsert.execute(docA)

    const expectedStr = "hello world"
    const expectedNbBlocks = 3
    t.is(docA.str, expectedStr, `docA.str = ${expectedStr}`)
    t.is(docA.getNbBlocks(), expectedNbBlocks, `docA.getNbBlocks() = ${expectedNbBlocks}`)
})

test.failing("insert-then-concurrent-rename", (t) => {
    const replicaNumberA = 1
    const docA = new RenamableReplicableList(replicaNumberA)
    const replicaNumberB = 2
    const docB = new RenamableReplicableList(replicaNumberB)

    const event1 = docA.insertLocal(0, "helo")
    event1.execute(docB)
    const event2 = docB.insertLocal(4, " wor")
    event2.execute(docA)
    const event3 = docA.insertLocal(8, "ld")
    event3.execute(docB)

    const concurrentRename = docA.renameLocal()
    docB.insertLocal(2, "l")

    concurrentRename.execute(docB)

    const expectedStr = "hello world"
    const expectedNbBlocks = 3
    t.is(docA.str, expectedStr, `docA.str = ${expectedStr}`)
    t.is(docA.getNbBlocks(), expectedNbBlocks, `docA.getNbBlocks() = ${expectedNbBlocks}`)
})

test("rename-then-concurrent-delete", (t) => {
    const replicaNumberA = 1
    const docA = new RenamableReplicableList(replicaNumberA)
    const replicaNumberB = 2
    const docB = new RenamableReplicableList(replicaNumberB)

    const event1 = docA.insertLocal(0, "helllo")
    event1.execute(docB)
    const event2 = docB.insertLocal(6, " wor")
    event2.execute(docA)
    const event3 = docA.insertLocal(10, "ld")
    event3.execute(docB)

    docA.renameLocal()
    const concurrentDelete = docB.delLocal(2, 2)

    concurrentDelete.execute(docA)

    const expectedStr = "hello world"
    const expectedNbBlocks = 2
    t.is(docA.str, expectedStr, `docA.str = ${expectedStr}`)
    t.is(docA.getNbBlocks(), expectedNbBlocks, `docA.getNbBlocks() = ${expectedNbBlocks}`)
})

test.failing("delete-then-concurrent-rename", (t) => {
    const replicaNumberA = 1
    const docA = new RenamableReplicableList(replicaNumberA)
    const replicaNumberB = 2
    const docB = new RenamableReplicableList(replicaNumberB)

    const event1 = docA.insertLocal(0, "helllo")
    event1.execute(docB)
    const event2 = docB.insertLocal(6, " wor")
    event2.execute(docA)
    const event3 = docA.insertLocal(10, "ld")
    event3.execute(docB)

    const concurrentRename = docA.renameLocal()
    docB.delLocal(2, 2)

    concurrentRename.execute(docB)

    const expectedStr = "hello world"
    const expectedNbBlocks = 2
    t.is(docA.str, expectedStr, `docA.str = ${expectedStr}`)
    t.is(docA.getNbBlocks(), expectedNbBlocks, `docA.getNbBlocks() = ${expectedNbBlocks}`)
})
