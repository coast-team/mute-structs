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
import {Ordering} from "../src/ordering"
import {ExtendedRenamingMap} from "../src/renamingmap/extendedrenamingmap"
import {generateIdIntervalFactory, idFactory} from "./helpers"

function generateRenamingMap (): ExtendedRenamingMap {
    const renamedIdIntervals = [
        generateIdIntervalFactory(10, 0, 0, 0)(3),
        generateIdIntervalFactory(42, 1, 5, 6)(9),
        generateIdIntervalFactory(53, 2, 1, 0)(0),
        generateIdIntervalFactory(53, 2, 1, 2)(5),
    ]
    return new ExtendedRenamingMap(3, 0, renamedIdIntervals)
}

test("constructor", (t) => {
    const renamedIdIntervals = [
        generateIdIntervalFactory(10, 0, 0, -2)(1),
        generateIdIntervalFactory(10, 0, 0, 1, 42, 2, 0, 0)(3),
        generateIdIntervalFactory(10, 0, 0, 2)(3),
    ]
    const expectedIds = [
        idFactory(10, 0, 0, -2),
        idFactory(10, 0, 0, -1),
        idFactory(10, 0, 0, 0),
        idFactory(10, 0, 0, 1),
        idFactory(10, 0, 0, 1, 42, 2, 0, 0),
        idFactory(10, 0, 0, 1, 42, 2, 0, 1),
        idFactory(10, 0, 0, 1, 42, 2, 0, 2),
        idFactory(10, 0, 0, 1, 42, 2, 0, 3),
        idFactory(10, 0, 0, 2),
        idFactory(10, 0, 0, 3),
    ]

    const renamingMap = new ExtendedRenamingMap(1, 1, renamedIdIntervals)

    t.deepEqual(renamingMap.renamedIds, expectedIds, "renamingMap.renamedIds = expectedIds")
})

test("renameId() of renamed id", (t) => {
    /*
        <10, 0, 0>[0..3] -> <10, 3, 0>[0..3],
        <42, 1, 5>[6..9] -> <10, 3, 0>[4..7],
        <53, 2, 1>[0..0] -> <10, 3, 0>[8..8],
        <53, 2, 1>[2..5] -> <10, 3, 0>[9..12]
    */
    const renamingMap = generateRenamingMap()

    const id1 = idFactory(10, 0, 0, 1)
    const expectedNewId1 = idFactory(10, 3, 0, 1)
    const actualNewId1 = renamingMap.renameId(id1)
    t.deepEqual(actualNewId1, expectedNewId1, "actualId = expectedNewId")

    const id2 = idFactory(42, 1, 5, 8)
    const expectedNewId2 = idFactory(10, 3, 0, 6)
    const actualNewId2 = renamingMap.renameId(id2)
    t.deepEqual(actualNewId2, expectedNewId2, "actualId = expectedNewId")

    const id3 = idFactory(53, 2, 1, 2)
    const expectedNewId3 = idFactory(10, 3, 0, 9)
    const actualNewId3 = renamingMap.renameId(id3)
    t.deepEqual(actualNewId3, expectedNewId3, "actualId = expectedNewId")
})

test("renameId() of concurrently inserted id such as id < firstId", (t) => {
    /*
        <10, 0, 0>[0..3] -> <10, 3, 0>[0..3],
        <42, 1, 5>[6..9] -> <10, 3, 0>[4..7],
        <53, 2, 1>[0..0] -> <10, 3, 0>[8..8],
        <53, 2, 1>[2..5] -> <10, 3, 0>[9..12]
    */
    const renamingMap = generateRenamingMap()

    const id1 = idFactory(6, 6, 0, 0)
    const expectedNewId1 = idFactory(6, 6, 0, 0)
    const actualNewId1 = renamingMap.renameId(id1)
    t.deepEqual(actualNewId1, expectedNewId1, "actualId = expectedNewId")

    const id2 = idFactory(10, 0, 0, -1)
    const expectedNewId2 = idFactory(10, 0, 0, -1)
    const actualNewId2 = renamingMap.renameId(id2)
    t.deepEqual(actualNewId2, expectedNewId2, "actualId = expectedNewId")
})

test("renameId() of concurrently inserted id such as firstId < id < lastId", (t) => {
    /*
        <10, 0, 0>[0..3] -> <10, 3, 0>[0..3],
        <42, 1, 5>[6..9] -> <10, 3, 0>[4..7],
        <53, 2, 1>[0..0] -> <10, 3, 0>[8..8],
        <53, 2, 1>[2..5] -> <10, 3, 0>[9..12]
    */
    const renamingMap = generateRenamingMap()

    const id1 = idFactory(23, 23, 0, 0)
    const expectedNewId1 = idFactory(10, 3, 0, 3, 23, 23, 0, 0)
    const actualNewId1 = renamingMap.renameId(id1)
    t.deepEqual(actualNewId1, expectedNewId1, "actualId = expectedNewId")

    const id2 = idFactory(42, 1, 5, 8, 7, 0, 1, 0)
    const expectedNewId2 = idFactory(10, 3, 0, 6, 42, 1, 5, 8, 7, 0, 1, 0)
    const actualNewId2 = renamingMap.renameId(id2)
    t.deepEqual(actualNewId2, expectedNewId2, "actualId = expectedNewId")

})

test("renameId() of concurrently inserted id such as lastId < id", (t) => {
    /*
        <10, 0, 0>[0..3] -> <10, 3, 0>[0..3],
        <42, 1, 5>[6..9] -> <10, 3, 0>[4..7],
        <53, 2, 1>[0..0] -> <10, 3, 0>[8..8],
        <53, 2, 1>[2..5] -> <10, 3, 0>[9..12]
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

test("reverseRenameId() of renamed id", (t) => {
    /*
        <10, 0, 0>[0..3] -> <10, 3, 0>[0..3],
        <42, 1, 5>[6..9] -> <10, 3, 0>[4..7],
        <53, 2, 1>[0..0] -> <10, 3, 0>[8..8],
        <53, 2, 1>[2..5] -> <10, 3, 0>[9..12]
    */
    const renamingMap = generateRenamingMap()

    const id1 = idFactory(10, 3, 0, 1)
    const expectedNewId1 = idFactory(10, 0, 0, 1)
    const actualNewId1 = renamingMap.reverseRenameId(id1)
    t.deepEqual(actualNewId1, expectedNewId1, "actualId = expectedNewId")

    const id2 = idFactory(10, 3, 0, 6)
    const expectedNewId2 = idFactory(42, 1, 5, 8)
    const actualNewId2 = renamingMap.reverseRenameId(id2)
    t.deepEqual(actualNewId2, expectedNewId2, "actualId = expectedNewId")

    const id3 = idFactory(10, 3, 0, 9)
    const expectedNewId3 = idFactory(53, 2, 1, 2)
    const actualNewId3 = renamingMap.reverseRenameId(id3)
    t.deepEqual(actualNewId3, expectedNewId3, "actualId = expectedNewId")
})

test("reverseRenameId() of id such as id < firstId", (t) => {
    /*
        <10, 0, 0>[0..3] -> <10, 3, 0>[0..3],
        <42, 1, 5>[6..9] -> <10, 3, 0>[4..7],
        <53, 2, 1>[0..0] -> <10, 3, 0>[8..8],
        <53, 2, 1>[2..5] -> <10, 3, 0>[9..12]
    */
    const renamingMap = generateRenamingMap()

    const id1 = idFactory(6, 6, 0, 0)
    const expectedNewId1 = idFactory(6, 6, 0, 0)
    const actualNewId1 = renamingMap.reverseRenameId(id1)
    t.deepEqual(actualNewId1, expectedNewId1, "actualId = expectedNewId")

    const id2 = idFactory(10, 0, 0, -1)
    const expectedNewId2 = idFactory(10, 0, 0, -1)
    const actualNewId2 = renamingMap.reverseRenameId(id2)
    t.deepEqual(actualNewId2, expectedNewId2, "actualId = expectedNewId")
})

test("reverseRenameId() of id such as firstId < predecessorId < id < successorId < lastId", (t) => {
    /*
        <10, 0, 0>[0..3] -> <10, 3, 0>[0..3],
        <42, 1, 5>[6..9] -> <10, 3, 0>[4..7],
        <53, 2, 1>[0..0] -> <10, 3, 0>[8..8],
        <53, 2, 1>[2..5] -> <10, 3, 0>[9..12]
    */
    const renamingMap = generateRenamingMap()

    const id1 = idFactory(10, 3, 0, 3, 23, 23, 0, 0)
    const expectedNewId1 = idFactory(23, 23, 0, 0)
    const actualNewId1 = renamingMap.reverseRenameId(id1)
    t.deepEqual(actualNewId1, expectedNewId1, "actualId = expectedNewId")

    const id2 = idFactory(10, 3, 0, 6, 42, 1, 5, 8, 7, 0, 1, 0)
    const expectedNewId2 = idFactory(42, 1, 5, 8, 7, 0, 1, 0)
    const actualNewId2 = renamingMap.reverseRenameId(id2)
    t.deepEqual(actualNewId2, expectedNewId2, "actualId = expectedNewId")
})

test("reverseRenameId() of concurrently inserted id such as lastId < id", (t) => {
    /*
        <10, 0, 0>[0..3] -> <10, 3, 0>[0..3],
        <42, 1, 5>[6..9] -> <10, 3, 0>[4..7],
        <53, 2, 1>[0..0] -> <10, 3, 0>[8..8],
        <53, 2, 1>[2..5] -> <10, 3, 0>[9..12]
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

test("renameId() retains order between ids", (t) => {
    /*
        <10, 0, 0>[0..3] -> <10, 3, 0>[0..3],
        <42, 1, 5>[6..9] -> <10, 3, 0>[4..7],
        <53, 2, 1>[0..0] -> <10, 3, 0>[8..8],
        <53, 2, 1>[2..5] -> <10, 3, 0>[9..12]
    */
    const renamingMap = generateRenamingMap()

    const ids = [
        idFactory(6, 6, 0, 0),
        idFactory(10, 0, 0, 0),
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
        idFactory(57, 57, 0, 0),
    ]
    const renamedIds =
        ids.map((idToRename: Identifier): Identifier => renamingMap.renameId(idToRename))

    const compareFn = (a: Identifier, b: Identifier): Ordering => a.compareTo(b)
    t.true(isSorted(renamedIds, compareFn), "renameId() should retain the order between ids")
})

test("reverseRenameId() retains order between ids", (t) => {
    /*
        <10, 0, 0>[0..3] -> <10, 3, 0>[0..3],
        <42, 1, 5>[6..9] -> <10, 3, 0>[4..7],
        <53, 2, 1>[0..0] -> <10, 3, 0>[8..8],
        <53, 2, 1>[2..5] -> <10, 3, 0>[9..12]
    */
    const renamingMap = generateRenamingMap()

    const ids = [
        idFactory(6, 6, 0, 0),
        idFactory(10, 3, 0, 0),
        idFactory(10, 3, 0, 0, 10, 42, 0, 0),
        idFactory(10, 3, 0, 3, 23, 23, 0, 0),
        idFactory(10, 3, 0, 6),
        idFactory(10, 3, 0, 6, -60, 4, 0, 0),
        idFactory(10, 3, 0, 6, 42, 1, 5, 8, 7, 0, 1, 0),
        idFactory(10, 3, 0, 6, 60, 4, 0, 0),
        idFactory(10, 3, 0, 7),
        idFactory(10, 3, 0, 7, 42, 1, 5, 9, 0, 5, 0, 0),
        idFactory(10, 3, 0, 7, 42, 1, 5, 10),
        idFactory(10, 3, 0, 7, 53, 2, 1, -1),
        idFactory(10, 3, 0, 7, 60, 4, 0 , 0),
        idFactory(10, 3, 0, 8),
        idFactory(10, 3, 0, 8, 53, 2, 1, 1),
        idFactory(10, 3, 0, 8, 60, 4, 0, 0),
    ]
    const renamedIds =
        ids.map((idToRename: Identifier): Identifier => renamingMap.reverseRenameId(idToRename))

    const compareFn = (a: Identifier, b: Identifier): Ordering => a.compareTo(b)
    t.true(isSorted(renamedIds, compareFn), "reverseRenameId() should retain the order between ids")
})

test("reverseRenameId(renameId(id)) returns id", (t) => {
    /*
        <10, 0, 0>[0..3] -> <10, 3, 0>[0..3],
        <42, 1, 5>[6..9] -> <10, 3, 0>[4..7],
        <53, 2, 1>[0..0] -> <10, 3, 0>[8..8],
        <53, 2, 1>[2..5] -> <10, 3, 0>[9..12]
    */
    const renamingMap = generateRenamingMap()

    const ids = [
        idFactory(6, 6, 0, 0),
        idFactory(10, 0, 0, 0),
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
        idFactory(57, 57, 0, 0),
    ]

    ids.forEach((expectedId: Identifier) => {
        const actualId = renamingMap.reverseRenameId(renamingMap.renameId(expectedId))

        t.deepEqual(actualId, expectedId, "reverseRenameId(renameId(id)) should return id")
    })
})
