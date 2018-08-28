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

import {isSorted} from "../src/helpers"
import {Identifier} from "../src/identifier"
import {INT32_BOTTOM, INT32_TOP} from "../src/int32"
import {Ordering} from "../src/ordering"
import {ExtendedRenamingMap} from "../src/renamingmap/extendedrenamingmap"
import {generateIdIntervalFactory, idFactory} from "./helpers"

function generateRenamingMap (firstIdReplicaNumber = -6): ExtendedRenamingMap {
    const renamedIdIntervals = [
        generateIdIntervalFactory(10, firstIdReplicaNumber, 0, 0)(3),
        generateIdIntervalFactory(42, 1, 5, 6)(9),
        generateIdIntervalFactory(53, 2, 1, 0)(0),
        generateIdIntervalFactory(53, 2, 1, 2)(5),
    ]
    return new ExtendedRenamingMap(0, 0, renamedIdIntervals)
}

test("constructor", (t) => {
    const renamedIdIntervals = [
        generateIdIntervalFactory(10, -6, 0, -2)(1),
        generateIdIntervalFactory(10, -6, 0, 1, 42, 2, 0, 0)(3),
        generateIdIntervalFactory(10, -6, 0, 2)(3),
    ]
    const expectedIds = [
        idFactory(10, -6, 0, -2),
        idFactory(10, -6, 0, -1),
        idFactory(10, -6, 0, 0),
        idFactory(10, -6, 0, 1),
        idFactory(10, -6, 0, 1, 42, 2, 0, 0),
        idFactory(10, -6, 0, 1, 42, 2, 0, 1),
        idFactory(10, -6, 0, 1, 42, 2, 0, 2),
        idFactory(10, -6, 0, 1, 42, 2, 0, 3),
        idFactory(10, -6, 0, 2),
        idFactory(10, -6, 0, 3),
    ]

    const renamingMap = new ExtendedRenamingMap(1, 1, renamedIdIntervals)

    t.deepEqual(renamingMap.renamedIds, expectedIds, "renamingMap.renamedIds = expectedIds")
})

test("renameId() of renamed id", (t) => {
    /*
        <10, -6, 0>[0..3] -> <10, 0, 0>[0..3],
        <42, 1, 5>[6..9] -> <10, 0, 0>[4..7],
        <53, 2, 1>[0..0] -> <10, 0, 0>[8..8],
        <53, 2, 1>[2..5] -> <10, 0, 0>[9..12]
    */
    const renamingMap = generateRenamingMap()

    const id1 = idFactory(10, -6, 0, 1)
    const expectedNewId1 = idFactory(10, 0, 0, 1)
    const actualNewId1 = renamingMap.renameId(id1)
    t.deepEqual(actualNewId1, expectedNewId1, "actualId = expectedNewId")

    const id2 = idFactory(42, 1, 5, 8)
    const expectedNewId2 = idFactory(10, 0, 0, 6)
    const actualNewId2 = renamingMap.renameId(id2)
    t.deepEqual(actualNewId2, expectedNewId2, "actualId = expectedNewId")

    const id3 = idFactory(53, 2, 1, 2)
    const expectedNewId3 = idFactory(10, 0, 0, 9)
    const actualNewId3 = renamingMap.renameId(id3)
    t.deepEqual(actualNewId3, expectedNewId3, "actualId = expectedNewId")
})

test("renameId() of concurrently inserted id such as id < firstId < newFirstId", (t) => {
    /*
        <10, -6, 0>[0..3] -> <10, 0, 0>[0..3],
        <42, 1, 5>[6..9] -> <10, 0, 0>[4..7],
        <53, 2, 1>[0..0] -> <10, 0, 0>[8..8],
        <53, 2, 1>[2..5] -> <10, 0, 0>[9..12]
    */
    const renamingMap = generateRenamingMap()

    const id1 = idFactory(6, 6, 0, 0)
    const expectedNewId1 = idFactory(6, 6, 0, 0)
    const actualNewId1 = renamingMap.renameId(id1)
    t.deepEqual(actualNewId1, expectedNewId1, "actualId = expectedNewId")

    const id2 = idFactory(10, -6, 0, -1)
    const expectedNewId2 = idFactory(10, -6, 0, -1)
    const actualNewId2 = renamingMap.renameId(id2)
    t.deepEqual(actualNewId2, expectedNewId2, "actualId = expectedNewId")
})

test("renameId() of concurrently inserted id such as newFirstId < id < firstId", (t) => {
    /*
        <10, 6, 0>[0..3] -> <10, 0, 0>[0..3],
        <42, 1, 5>[6..9] -> <10, 0, 0>[4..7],
        <53, 2, 1>[0..0] -> <10, 0, 0>[8..8],
        <53, 2, 1>[2..5] -> <10, 0, 0>[9..12]
    */
    const renamingMap = generateRenamingMap(6)

    const id1 = idFactory(10, 6, 0, -1)
    const expectedNewId1 = idFactory(10, 0, 0, -1, 10, 6, 0, -1)
    const actualNewId1 = renamingMap.renameId(id1)
    t.deepEqual(actualNewId1, expectedNewId1, "actualId = expectedNewId")

    const id2 = idFactory(10, 3, 0, 0)
    const expectedNewId2 = idFactory(10, 0, 0, -1, 10, 3, 0, 0)
    const actualNewId2 = renamingMap.renameId(id2)
    t.deepEqual(actualNewId2, expectedNewId2, "actualId = expectedNewId")
})

test("renameId() of concurrently inserted id such as firstId < id < lastId", (t) => {
    /*
        <10, -6, 0>[0..3] -> <10, 0, 0>[0..3],
        <42, 1, 5>[6..9] -> <10, 0, 0>[4..7],
        <53, 2, 1>[0..0] -> <10, 0, 0>[8..8],
        <53, 2, 1>[2..5] -> <10, 0, 0>[9..12]
    */
    const renamingMap = generateRenamingMap()

    const id1 = idFactory(23, 23, 0, 0)
    const expectedNewId1 = idFactory(10, 0, 0, 3, 23, 23, 0, 0)
    const actualNewId1 = renamingMap.renameId(id1)
    t.deepEqual(actualNewId1, expectedNewId1, "actualId = expectedNewId")

    const id2 = idFactory(42, 1, 5, 8, 7, 0, 1, 0)
    const expectedNewId2 = idFactory(10, 0, 0, 6, 42, 1, 5, 8, 7, 0, 1, 0)
    const actualNewId2 = renamingMap.renameId(id2)
    t.deepEqual(actualNewId2, expectedNewId2, "actualId = expectedNewId")

})

test("renameId() of concurrently inserted id such as newLastId < lastId < id", (t) => {
    /*
        <10, -6, 0>[0..3] -> <10, 0, 0>[0..3],
        <42, 1, 5>[6..9] -> <10, 0, 0>[4..7],
        <53, 2, 1>[0..0] -> <10, 0, 0>[8..8],
        <53, 2, 1>[2..5] -> <10, 0, 0>[9..12]
    */
    const renamingMap = generateRenamingMap()

    const id1 = idFactory(53, 2, 1, 6)
    const expectedNewId1 = idFactory(53, 2, 1, 6)
    const actualNewId1 = renamingMap.renameId(id1)
    t.deepEqual(actualNewId1, expectedNewId1, "actualId = expectedNewId")

    const id2 = idFactory(57, 57, 0, 0)
    const expectedNewId2 = idFactory(57, 57, 0, 0)
    const actualNewId2 = renamingMap.renameId(id2)
    t.deepEqual(actualNewId2, expectedNewId2, "actualId = expectedNewId")
})

test("renameId() of concurrently inserted id such as lastId < id < newLastId", (t) => {
    /*
        <10, -6, 0>[0..3] -> <10, 0, 0>[0..3],
        <10, -6, 0>[5..5] -> <10, 0, 0>[4..4]
    */
    const renamedIdIntervals = [
        generateIdIntervalFactory(10, -6, 0, 0)(3),
        generateIdIntervalFactory(10, -6, 0, 5)(5),
    ]
    const renamingMap = new ExtendedRenamingMap(0, 0, renamedIdIntervals)

    const id = idFactory(10, -6, 0, 6)
    const expectedNewId = idFactory(10, 0, 0, 4, 10, -6, 0, 6)
    const actualNewId = renamingMap.renameId(id)
    t.deepEqual(actualNewId, expectedNewId, "actualId = expectedNewId")
})

test("reverseRenameId() of renamed id", (t) => {
    /*
        <10, -6, 0>[0..3] -> <10, 0, 0>[0..3],
        <42, 1, 5>[6..9] -> <10, 0, 0>[4..7],
        <53, 2, 1>[0..0] -> <10, 0, 0>[8..8],
        <53, 2, 1>[2..5] -> <10, 0, 0>[9..12]
    */
    const renamingMap = generateRenamingMap()

    const id1 = idFactory(10, 0, 0, 1)
    const expectedNewId1 = idFactory(10, -6, 0, 1)
    const actualNewId1 = renamingMap.reverseRenameId(id1)
    t.deepEqual(actualNewId1, expectedNewId1, "actualId = expectedNewId")

    const id2 = idFactory(10, 0, 0, 6)
    const expectedNewId2 = idFactory(42, 1, 5, 8)
    const actualNewId2 = renamingMap.reverseRenameId(id2)
    t.deepEqual(actualNewId2, expectedNewId2, "actualId = expectedNewId")

    const id3 = idFactory(10, 0, 0, 9)
    const expectedNewId3 = idFactory(53, 2, 1, 2)
    const actualNewId3 = renamingMap.reverseRenameId(id3)
    t.deepEqual(actualNewId3, expectedNewId3, "actualId = expectedNewId")
})

test("reverseRenameId() of id such as id < firstId < newFirstId", (t) => {
    /*
        <10, -6, 0>[0..3] -> <10, 0, 0>[0..3],
        <42, 1, 5>[6..9] -> <10, 0, 0>[4..7],
        <53, 2, 1>[0..0] -> <10, 0, 0>[8..8],
        <53, 2, 1>[2..5] -> <10, 0, 0>[9..12]
    */
    const renamingMap = generateRenamingMap()

    const id1 = idFactory(6, 6, 0, 0)
    const expectedNewId1 = idFactory(6, 6, 0, 0)
    const actualNewId1 = renamingMap.reverseRenameId(id1)
    t.deepEqual(actualNewId1, expectedNewId1, "actualId = expectedNewId")

    const id2 = idFactory(10, -6, 0, -1)
    const expectedNewId2 = idFactory(10, -6, 0, -1)
    const actualNewId2 = renamingMap.reverseRenameId(id2)
    t.deepEqual(actualNewId2, expectedNewId2, "actualId = expectedNewId")
})

test("reverseRenameId() of concurrently inserted id such as newFirstId < id < firstId", (t) => {
    /*
        <10, 6, 0>[0..3] -> <10, 0, 0>[0..3],
        <42, 1, 5>[6..9] -> <10, 0, 0>[4..7],
        <53, 2, 1>[0..0] -> <10, 0, 0>[8..8],
        <53, 2, 1>[2..5] -> <10, 0, 0>[9..12]
    */
    const renamingMap = generateRenamingMap(6)

    const id1 = idFactory(10, 0, 0, -1, 10, 6, 0, -1)
    const expectedNewId1 = idFactory(10, 6, 0, -1)
    const actualNewId1 = renamingMap.reverseRenameId(id1)
    t.deepEqual(actualNewId1, expectedNewId1, "actualId = expectedNewId")

    const id2 = idFactory(10, 0, 0, -1, 10, 3, 0, 0)
    const expectedNewId2 = idFactory(10, 3, 0, 0)
    const actualNewId2 = renamingMap.reverseRenameId(id2)
    t.deepEqual(actualNewId2, expectedNewId2, "actualId = expectedNewId")

    const id3 = idFactory(10, 0, 0, -1, 5, 5, 0, 0)
    const expectedNewId3 = idFactory(10, 0, 0, -1, 5, 5, 0, 0)
    const actualNewId3 = renamingMap.reverseRenameId(id3)
    t.deepEqual(actualNewId3, expectedNewId3, "actualId = expectedNewId")

    const id4 = idFactory(10, 0, 0, -1, 52, 52, 0, 0)
    const expectedNewId4 = idFactory(10, 6, 0, -1, 52, 52, 0, 0)
    const actualNewId4 = renamingMap.reverseRenameId(id4)
    t.deepEqual(actualNewId4, expectedNewId4, "actualId = expectedNewId")
})

test("reverseRenameId() of id such as firstId < predecessorId < id < successorId < lastId", (t) => {
    /*
        <10, -6, 0>[0..3] -> <10, 0, 0>[0..3],
        <42, 1, 5>[6..9] -> <10, 0, 0>[4..7],
        <53, 2, 1>[0..0] -> <10, 0, 0>[8..8],
        <53, 2, 1>[2..5] -> <10, 0, 0>[9..12]
    */
    const renamingMap = generateRenamingMap()

    const id1 = idFactory(10, 0, 0, 3, 23, 23, 0, 0)
    const expectedNewId1 = idFactory(23, 23, 0, 0)
    const actualNewId1 = renamingMap.reverseRenameId(id1)
    t.deepEqual(actualNewId1, expectedNewId1, "actualId = expectedNewId")

    const id2 = idFactory(10, 0, 0, 6, 42, 1, 5, 8, 7, 0, 1, 0)
    const expectedNewId2 = idFactory(42, 1, 5, 8, 7, 0, 1, 0)
    const actualNewId2 = renamingMap.reverseRenameId(id2)
    t.deepEqual(actualNewId2, expectedNewId2, "actualId = expectedNewId")
})

test("reverseRenameId() of concurrently inserted id such as newLastId < lastId < id", (t) => {
    /*
        <10, -6, 0>[0..3] -> <10, 0, 0>[0..3],
        <42, 1, 5>[6..9] -> <10, 0, 0>[4..7],
        <53, 2, 1>[0..0] -> <10, 0, 0>[8..8],
        <53, 2, 1>[2..5] -> <10, 0, 0>[9..12]
    */
    const renamingMap = generateRenamingMap()

    const id1 = idFactory(53, 2, 1, 6)
    const expectedNewId1 = idFactory(53, 2, 1, 6)
    const actualNewId1 = renamingMap.reverseRenameId(id1)
    t.deepEqual(actualNewId1, expectedNewId1, "actualId = expectedNewId")

    const id2 = idFactory(57, 57, 0, 0)
    const expectedNewId2 = idFactory(57, 57, 0, 0)
    const actualNewId2 = renamingMap.reverseRenameId(id2)
    t.deepEqual(actualNewId2, expectedNewId2, "actualId = expectedNewId")
})

test("reverseRenameId() of concurrently inserted id such as  newLastId < id < lastId", (t) => {
    /*
        <10, -6, 0>[0..3] -> <10, 0, 0>[0..3],
        <42, 1, 5>[6..9] -> <10, 0, 0>[4..7],
        <53, 2, 1>[0..0] -> <10, 0, 0>[8..8],
        <53, 2, 1>[2..5] -> <10, 0, 0>[9..12]
    */
    const renamingMap = generateRenamingMap()

    const id1 = idFactory(33, 33, 0, 0)
    const expectedNewId1 = idFactory(53, 2, 1, 5, 33, 33, 0, 0)
    const actualNewId1 = renamingMap.reverseRenameId(id1)
    t.deepEqual(actualNewId1, expectedNewId1, "actualId = expectedNewId")

    const id2 = idFactory(42, 42, 0, 0)
    const expectedNewId2 = idFactory(53, 2, 1, 5, 42, 42, 0, 0)
    const actualNewId2 = renamingMap.reverseRenameId(id2)
    t.deepEqual(actualNewId2, expectedNewId2, "actualId = expectedNewId")
})

test("renameId() retains order between ids", (t) => {
    /*
        <10, -6, 0>[0..3] -> <10, 0, 0>[0..3],
        <42, 1, 5>[6..9] -> <10, 0, 0>[4..7],
        <53, 2, 1>[0..0] -> <10, 0, 0>[8..8],
        <53, 2, 1>[2..5] -> <10, 0, 0>[9..12]
    */
    const renamingMap = generateRenamingMap()

    const ids = [
        idFactory(6, 6, 0, 0),
        idFactory(10, -6, 0, -1),
        idFactory(10, -6, 0, 0),
        idFactory(10, 42, 0, 0),
        idFactory(23, 23, 0, 0),
        idFactory(42, 1, 5, 8),
        idFactory(42, 1, 5, 8, 7, 0, 1, 0),
        idFactory(42, 1, 5, 9),
        idFactory(42, 1, 5, 9, 0, 5, 0, 0),
        idFactory(42, 1, 5, 10),
        idFactory(53, 2, 1, -1),
        idFactory(53, 2, 1, 0),
        idFactory(53, 2, 1, 1),
        idFactory(53, 2, 1, 2),
        idFactory(53, 2, 1, 6),
        idFactory(57, 57, 0, 0),
    ]
    const renamedIds =
        ids.map((idToRename: Identifier): Identifier => renamingMap.renameId(idToRename))

    const compareFn = (a: Identifier, b: Identifier): Ordering => a.compareTo(b)
    t.true(isSorted(renamedIds, compareFn), "renameId() should retain the order between ids")
})

test("reverseRenameId() retains order between ids", (t) => {
    /*
        <10, -6, 0>[0..3] -> <10, 0, 0>[0..3],
        <42, 1, 5>[6..9] -> <10, 0, 0>[4..7],
        <53, 2, 1>[0..0] -> <10, 0, 0>[8..8],
        <53, 2, 1>[2..5] -> <10, 0, 0>[9..12]
    */
    const renamingMap = generateRenamingMap()

    const ids = [
        idFactory(6, 6, 0, 0),
        idFactory(10, -6, 0, -1),
        idFactory(10, 0, 0, 0),
        idFactory(10, 0, 0, 0, 10, 42, 0, 0),
        idFactory(10, 0, 0, 1, -60, 4, 0, 0),
        idFactory(10, 0, 0, 1, 60, 4, 0, 0),
        idFactory(10, 0, 0, 3, 23, 23, 0, 0),
        idFactory(10, 0, 0, 6),
        idFactory(10, 0, 0, 6, -60, 4, 0, 0),
        idFactory(10, 0, 0, 6, 42, 1, 5, 8, 7, 0, 1, 0),
        idFactory(10, 0, 0, 6, 60, 4, 0, 0),
        idFactory(10, 0, 0, 7),
        idFactory(10, 0, 0, 7, 42, 1, 5, 9, 0, 5, 0, 0),
        idFactory(10, 0, 0, 7, 42, 1, 5, 10),
        idFactory(10, 0, 0, 7, 53, 2, 1, -1),
        idFactory(10, 0, 0, 7, 60, 4, 0 , 0),
        idFactory(10, 0, 0, 8),
        idFactory(10, 0, 0, 8, 53, 2, 1, 1),
        idFactory(10, 0, 0, 8, 60, 4, 0, 0),
        idFactory(10, 0, 0, 9),
        idFactory(33, 33, 0, 0),
        idFactory(42, 42, 0, 0),
        idFactory(53, 2, 1, 6),
        idFactory(57, 57, 0, 0),
    ]
    const renamedIds =
        ids.map((idToRename: Identifier): Identifier => renamingMap.reverseRenameId(idToRename))

    const compareFn = (a: Identifier, b: Identifier): Ordering => a.compareTo(b)
    t.true(isSorted(renamedIds, compareFn), "reverseRenameId() should retain the order between ids")
})

test("reverseRename(id) retains order between ids with tail < predecessorId", (t) => {
    /*
        < -146, 1, 0>[5..5] -> < -146, 0, 92>[0..0],
        < -146, 1, 0, 5, -185, 2, 48>[0..0] -> < -146, 0, 92>[1, 1]
    */
    const renamedIdIntervals = [
        generateIdIntervalFactory(-146, 1, 0, 5)(5),
        generateIdIntervalFactory(-146, 1, 0, 5, -185, 2, 48, 0)(0),
    ]
    const renamingMap = new ExtendedRenamingMap(0, 92, renamedIdIntervals)

    const ids = [
        idFactory(-146, 0, 92, 0),
        idFactory(-146, 0, 92, 0, -154, 1, 556, 0),
        idFactory(-146, 0, 92, 1),
    ]
    const expectedNewIds = [
        idFactory(-146, 1, 0, 5),
        idFactory(-146, 1, 0, 5, INT32_BOTTOM, 0, 0, 0, -154, 1, 556, 0),
        idFactory(-146, 1, 0, 5, -185, 2, 48, 0),
    ]
    const actualIds = ids.map((id: Identifier): Identifier => renamingMap.reverseRenameId(id))

    actualIds.forEach((actualNewId: Identifier, index: number) => {
        const expectedNewId = expectedNewIds[index]
        t.deepEqual(actualNewId, expectedNewId, "actualNewId = expectedNewId")
    })
})

test("reverseRename(id) retains order between ids with closestPredecessorOfSuccessorId < predecessorId", (t) => {
    /*
        < -208, 2, 41, -5, 195, 1, 45>[4..4] -> < -208, 0, 0>[0..0],
        < -208, 2, 41>[-4..0] -> < -208, 0, 0>[1, 5]
    */
    const renamedIdIntervals = [
        generateIdIntervalFactory(-208, 2, 41, -5, 195, 1, 45, 4)(4),
        generateIdIntervalFactory(-208, 2, 41, -4)(0),
    ]
    const renamingMap = new ExtendedRenamingMap(0, 0, renamedIdIntervals)

    const ids = [
        idFactory(-208, 0, 0, 0),
        idFactory(-208, 0, 0, 0, -197, 2, 223, 0),
        idFactory(-208, 0, 0, 1),
    ]
    const expectedNewIds = [
        idFactory(-208, 2, 41, -5, 195, 1, 45, 4),
        idFactory(-208, 2, 41, -5, INT32_TOP, 0, 0, 0, -197, 2, 223, 0),
        idFactory(-208, 2, 41, -4),
    ]
    const actualIds = ids.map((id: Identifier): Identifier => renamingMap.reverseRenameId(id))

    actualIds.forEach((actualNewId: Identifier, index: number) => {
        const expectedNewId = expectedNewIds[index]
        t.deepEqual(actualNewId, expectedNewId, "actualNewId = expectedNewId")
    })
})

test("reverseRenameId(renameId(id)) returns id", (t) => {
    /*
        <10, -6, 0>[0..3] -> <10, 0, 0>[0..3],
        <42, 1, 5>[6..9] -> <10, 0, 0>[4..7],
        <53, 2, 1>[0..0] -> <10, 0, 0>[8..8],
        <53, 2, 1>[2..5] -> <10, 0, 0>[9..12]
    */
    const renamingMap = generateRenamingMap()

    const ids = [
        idFactory(6, 6, 0, 0),
        idFactory(10, -6, 0, -1),
        idFactory(10, -6, 0, 0),
        idFactory(10, 42, 0, 0),
        idFactory(23, 23, 0, 0),
        idFactory(42, 1, 5, 8),
        idFactory(42, 1, 5, 8, 7, 0, 1, 0),
        idFactory(42, 1, 5, 9),
        idFactory(42, 1, 5, 9, 0, 5, 0, 0),
        idFactory(42, 1, 5, 10),
        idFactory(53, 2, 1, -1),
        idFactory(53, 2, 1, 0),
        idFactory(53, 2, 1, 1),
        idFactory(53, 2, 1, 2),
        idFactory(53, 2, 1, 6),
        idFactory(57, 57, 0, 0),
    ]

    ids.forEach((expectedId: Identifier) => {
        const actualId = renamingMap.reverseRenameId(renamingMap.renameId(expectedId))

        t.deepEqual(actualId, expectedId, "reverseRenameId(renameId(id)) = id")
    })
})
