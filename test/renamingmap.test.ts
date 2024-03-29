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
import {createBetweenPosition, INT32_BOTTOM_USER} from "../src/idfactory"
import {INT32_BOTTOM, INT32_TOP} from "../src/int32"
import {Ordering} from "../src/ordering"
import {RenamingMap} from "../src/renamingmap/renamingmap"
import {generateIdIntervalFactory, idFactory} from "./helpers"

function generateRenamingMap (firstIdReplicaNumber = -6): RenamingMap {
    const renamedIdIntervals = [
        generateIdIntervalFactory(10, firstIdReplicaNumber, 0, 0)(3),
        generateIdIntervalFactory(42, 1, 5, 6)(9),
        generateIdIntervalFactory(53, 2, 1, 0)(0),
        generateIdIntervalFactory(53, 2, 1, 2)(5),
    ]
    return new RenamingMap(0, 0, renamedIdIntervals)
}

test("constructor", (t) => {
    const expectedRenamedIdIntervals = [
        generateIdIntervalFactory(10, -6, 0, -2)(1),
        generateIdIntervalFactory(10, -6, 0, 1, 42, 2, 0, 0)(3),
        generateIdIntervalFactory(10, -6, 0, 2)(3),
    ]

    const renamingMap = new RenamingMap(1, 1, expectedRenamedIdIntervals)

    t.deepEqual(renamingMap.renamedIdIntervals, expectedRenamedIdIntervals,
        "renamingMap.renamedIdIntervals = expectedRenamedIdIntervals")
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
    const actualNewId1 = renamingMap.initRenameIds([id1])[0]
    console.log("actualNewId1: " + actualNewId1)
    t.deepEqual(actualNewId1, expectedNewId1, "actualId = expectedNewId")

    const id2 = idFactory(42, 1, 5, 8)
    const expectedNewId2 = idFactory(10, 0, 0, 6)
    const actualNewId2 = renamingMap.initRenameIds([id2])[0]
    t.deepEqual(actualNewId2, expectedNewId2, "actualId = expectedNewId")

    const id3 = idFactory(53, 2, 1, 2)
    const expectedNewId3 = idFactory(10, 0, 0, 9)
    const actualNewId3 = renamingMap.initRenameIds([id3])[0]
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
    const actualNewId1 = renamingMap.initRenameIds([id1])[0]
    t.deepEqual(actualNewId1, expectedNewId1, "actualId = expectedNewId")

    const id2 = idFactory(10, -6, 0, -1)
    const expectedNewId2 = idFactory(10, -6, 0, -1)
    const actualNewId2 = renamingMap.initRenameIds([id2])[0]
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
    const actualNewId1 = renamingMap.initRenameIds([id1])[0]
    t.deepEqual(actualNewId1, expectedNewId1, "actualId = expectedNewId")

    const id2 = idFactory(10, 3, 0, 0)
    const expectedNewId2 = idFactory(10, 0, 0, -1, 10, 3, 0, 0)
    const actualNewId2 = renamingMap.initRenameIds([id2])[0]
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
    const actualNewId1 = renamingMap.initRenameIds([id1])[0]
    t.deepEqual(actualNewId1, expectedNewId1, "actualId = expectedNewId")

    const id2 = idFactory(42, 1, 5, 8, 7, 0, 1, 0)
    const expectedNewId2 = idFactory(10, 0, 0, 6, 42, 1, 5, 8, 7, 0, 1, 0)
    const actualNewId2 = renamingMap.initRenameIds([id2])[0]
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
    const actualNewId1 = renamingMap.initRenameIds([id1])[0]
    t.deepEqual(actualNewId1, expectedNewId1, "actualId = expectedNewId")

    const id2 = idFactory(57, 57, 0, 0)
    const expectedNewId2 = idFactory(57, 57, 0, 0)
    const actualNewId2 = renamingMap.initRenameIds([id2])[0]
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
    const renamingMap = new RenamingMap(0, 0, renamedIdIntervals)

    const id = idFactory(10, -6, 0, 6)
    const expectedNewId = idFactory(10, 0, 0, 4, 10, -6, 0, 6)
    const actualNewId = renamingMap.initRenameIds([id])[0]
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

test(`reverseRenameId() of concurrently inserted id such as
    newFirstId < id < firstId, id = closestPredecessorOfNewFirstId + closestPredecessorOfFirstId`, (t) => {

    /*
        <10, 6, 0>[0..3] -> <10, 0, 0>[0..3],
        <42, 1, 5>[6..9] -> <10, 0, 0>[4..7],
        <53, 2, 1>[0..0] -> <10, 0, 0>[8..8],
        <53, 2, 1>[2..5] -> <10, 0, 0>[9..12]
    */
    const renamingMap = generateRenamingMap(6)

    const idAtEpoch1 = idFactory(10, 0, 0, -1, 10, 6, 0, -1)
    const expectedIdAtEpoch0 = idFactory(10, 6, 0, -1)
    const actualIdAtEpoch0 = renamingMap.reverseRenameId(idAtEpoch1)
    t.deepEqual(actualIdAtEpoch0, expectedIdAtEpoch0, "actualId = expectedNewId")
})

test(`reverseRenameId() of concurrently inserted id such as
    newFirstId < id < firstId, id = closestPredecessorOfnewFirstId + tail and tail ∈ ]newFirstId, firstId[`, (t) => {

        /*
        <10, 6, 0>[0..3] -> <10, 0, 0>[0..3],
        <42, 1, 5>[6..9] -> <10, 0, 0>[4..7],
        <53, 2, 1>[0..0] -> <10, 0, 0>[8..8],
        <53, 2, 1>[2..5] -> <10, 0, 0>[9..12]
    */
    const renamingMap = generateRenamingMap(6)

    const idAtEpoch1 = idFactory(10, 0, 0, -1, 10, 3, 0, 0)
    const expectedIdAtEpoch0 = idFactory(10, 3, 0, 0)
    const actualIdAtEpoch0 = renamingMap.reverseRenameId(idAtEpoch1)
    t.deepEqual(actualIdAtEpoch0, expectedIdAtEpoch0, "actualId = expectedNewId")
})

test(`reverseRenameId() of causally inserted id such as
    newFirstId < id < firstId, id = closestPredecessorOfnewFirstId + tail and firstId < tail`, (t) => {

    /*
        <10, 6, 0>[0..3] -> <10, 0, 0>[0..3],
        <42, 1, 5>[6..9] -> <10, 0, 0>[4..7],
        <53, 2, 1>[0..0] -> <10, 0, 0>[8..8],
        <53, 2, 1>[2..5] -> <10, 0, 0>[9..12]
    */
    const renamingMap = generateRenamingMap(6)

    const idAtEpoch1 = idFactory(10, 0, 0, -1, 52, 52, 0, 0)
    const expectedIdAtEpoch0 = idFactory(10, 6, 0, -1, INT32_TOP, 0, 0, 0, 52, 52, 0, 0)
    const actualIdAtEpoch0 = renamingMap.reverseRenameId(idAtEpoch1)
    t.deepEqual(actualIdAtEpoch0, expectedIdAtEpoch0, "actualId = expectedNewId")
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
    const expectedNewId1 = idFactory(53, 2, 1, 5, INT32_BOTTOM, 0, 0, 0, 33, 33, 0, 0)
    const actualNewId1 = renamingMap.reverseRenameId(id1)
    t.deepEqual(actualNewId1, expectedNewId1, "actualId = expectedNewId")

    const id2 = idFactory(42, 42, 0, 0)
    const expectedNewId2 = idFactory(53, 2, 1, 5, INT32_BOTTOM, 0, 0, 0, 42, 42, 0, 0)
    const actualNewId2 = renamingMap.reverseRenameId(id2)
    t.deepEqual(actualNewId2, expectedNewId2, "actualId = expectedNewId")
})

test("reverseRenameId() of concurrently inserted id such as lastId < id < newLastId", (t) => {
    /*
        <10, -6, 0>[0..3] -> <10, 0, 0>[0..3],
    */
    const renamedIdIntervals = [
        generateIdIntervalFactory(10, -6, 0, 0)(3),
    ]
    const renamingMap = new RenamingMap(0, 0, renamedIdIntervals)

    const idAtEpoch0 = idFactory(10, -2, 0, 0)
    const expectedIdAtEpoch1 = idFactory(10, 0, 0, 3, 10, -2, 0, 0)
    const actualIdAtEpoch1 = renamingMap.initRenameIds([idAtEpoch0])[0]
    t.deepEqual(expectedIdAtEpoch1, actualIdAtEpoch1, "actualId = expectedNewId")

    const idAtEpoch1 = idFactory(10, 0, 0, 3, 10, -2, 0, 0)
    const expectedIdAtEpoch0 = idFactory(10, -2, 0, 0)
    const actualIdAtEpoch0 = renamingMap.reverseRenameId(idAtEpoch1)
    t.deepEqual(expectedIdAtEpoch0, actualIdAtEpoch0, "actualId = expectedNewId")
})

test(`reverseRenameId() of causally inserted id such as
    lastId < newLastId, id = newLastId + tail and tail < lastId`, (t) => {
    /*
        <10, -6, 0>[0..3] -> <10, 0, 0>[0..3],
    */
    const renamedIdIntervals = [
        generateIdIntervalFactory(10, -6, 0, 0)(3),
    ]
    const renamingMap = new RenamingMap(0, 0, renamedIdIntervals)

    const idAtEpoch1 = idFactory(10, 0, 0, 3, -53, -2, 0, 0)
    const expectedIdAtEpoch0 = idFactory(10, -6, 0, 3, INT32_BOTTOM, 0, 0, 0, -53, -2, 0, 0)
    const actualIdAtEpoch0 = renamingMap.reverseRenameId(idAtEpoch1)
    t.deepEqual(expectedIdAtEpoch0, actualIdAtEpoch0, "actualId = expectedNewId")
})

test(`reverseRenameId() of causally inserted id such as
    lastId < newLastId, id = newLastId + tail and newLastId < tail`, (t) => {
    /*
        <10, -6, 0>[0..3] -> <10, 0, 0>[0..3],
    */
    const renamedIdIntervals = [
        generateIdIntervalFactory(10, -6, 0, 0)(3),
    ]
    const renamingMap = new RenamingMap(0, 0, renamedIdIntervals)

    const idAtEpoch1 = idFactory(10, 0, 0, 3, 53, -2, 0, 0)
    const expectedIdAtEpoch0 = idFactory(10, 0, 0, 3, 53, -2, 0, 0)
    const actualIdAtEpoch0 = renamingMap.reverseRenameId(idAtEpoch1)
    t.deepEqual(expectedIdAtEpoch0, actualIdAtEpoch0, "actualId = expectedNewId")
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
        ids.map((idToRename: Identifier): Identifier => renamingMap.initRenameIds([idToRename])[0])

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
        idFactory(53, 2, 1, 5, INT32_BOTTOM_USER, 0, 0, 0, -60, 4, 0, 0),
        idFactory(53, 2, 1, 5, -60, 4, 0, 0),
        idFactory(53, 2, 1, 6),
        idFactory(57, 57, 0, 0),
    ]
    const renamedIds =
        ids.map((idToRename: Identifier): Identifier => renamingMap.reverseRenameId(idToRename))

    const compareFn = (a: Identifier, b: Identifier): Ordering => a.compareTo(b)
    t.true(isSorted(renamedIds, compareFn), "reverseRenameId() should retain the order between ids")
})

test("reverseRenameId() retains order between ids with lastId < newLastId", (t) => {
    /*
        <10, -6, 0>[0..3] -> <10, 0, 0>[0..3],
    */
    const renamedIdIntervals = [
        generateIdIntervalFactory(10, -6, 0, 0)(3),
    ]
    const renamingMap = new RenamingMap(0, 0, renamedIdIntervals)

    const ids = [
        idFactory(10, 0, 0, 3),
        idFactory(10, 0, 0, 3, -53, -2, 0, 0),
        idFactory(10, 0, 0, 3, 10, -2, 0, 0),
        idFactory(10, 0, 0, 3, 53, -2, 0, 0),
        idFactory(10, 1, 0, 0),
    ]

    const renamedIds =
        ids.map((idToRename: Identifier): Identifier => renamingMap.reverseRenameId(idToRename))

    const compareFn = (a: Identifier, b: Identifier): Ordering => a.compareTo(b)
    t.true(isSorted(renamedIds, compareFn), "reverseRenameId() should retain the order between ids")
})

test(`reverseRenameId() retains order between id1 and id2 with
    newFirstId < firstId,
    id1 concurrently inserted to rename op, id1 = closestPredecessorOfFirstId + tail1,
    id2 causally inserted to rename op and id1 insert op, id2 = closestPredecessorOfNewFirstId + tail2
    and tail2 < tail1`, (t) => {

    /*
        <10, 6, 0>[0..3] -> <10, 0, 0>[0..3],
        <42, 1, 5>[6..9] -> <10, 0, 0>[4..7],
        <53, 2, 1>[0..0] -> <10, 0, 0>[8..8],
        <53, 2, 1>[2..5] -> <10, 0, 0>[9..12]
    */
    const renamingMap = generateRenamingMap(6)

    const id1AtEpoch0 = idFactory(10, 6, 0, -1, 33, 0, 0, 0)
    const id1AtEpoch1 = renamingMap.initRenameIds([id1AtEpoch0])[0]

    const id2AtEpoch1 = idFactory(10, 0, 0, -1, 23, 0, 0, 0)

    const expectedOrderAtEpoch1 = Ordering.Less
    const actualOrderAtEpoch1 = id1AtEpoch1.compareTo(id2AtEpoch1)
    t.is(actualOrderAtEpoch1, expectedOrderAtEpoch1, "id1AtEpoch1 < id2AtEpoch1")

    const id2AtEpoch0 = renamingMap.reverseRenameId(id2AtEpoch1)

    const expectedOrderAtEpoch0 = Ordering.Less
    const actualOrderAtEpoch0 = id1AtEpoch0.compareTo(id2AtEpoch0)
    t.is(actualOrderAtEpoch0, expectedOrderAtEpoch0, "id1AtEpoch0 < id2AtEpoch0")
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
    const renamingMap = new RenamingMap(0, 92, renamedIdIntervals)

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
    const renamingMap = new RenamingMap(0, 0, renamedIdIntervals)

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
        const actualId = renamingMap.reverseRenameId(renamingMap.initRenameIds([expectedId])[0])

        t.deepEqual(actualId, expectedId, "reverseRenameId(renameId(id)) = id")
    })
})

test(`renameId(reverseRenameId(id)) returns id with
    newFirstId < firstId,
    id causally inserted to rename op,
    id = closestPredecessorOfNewFirstId + tail,
    firstId < tail`, (t) => {

    /*
        <10, 6, 0>[0..3] -> <10, 0, 0>[0..3],
        <42, 1, 5>[6..9] -> <10, 0, 0>[4..7],
        <53, 2, 1>[0..0] -> <10, 0, 0>[8..8],
        <53, 2, 1>[2..5] -> <10, 0, 0>[9..12]
    */
    const renamingMap = generateRenamingMap(6)

    const idAtEpoch1 = idFactory(10, 0, 0, -1, 99, 99, 0, 0)
    const idAtEpoch0 = renamingMap.reverseRenameId(idAtEpoch1)
    t.deepEqual(renamingMap.initRenameIds([idAtEpoch0])[0], idAtEpoch1)
})

test(`renameId(reverseRenameId(id)) returns id with
    id causally inserted to rename op,
    id = newPredId + tail,
    tail < predId`, (t) => {

    /*
        <10, -6, 0>[0..3] -> <10, 0, 0>[0..3],
        <42, 1, 5>[6..9] -> <10, 0, 0>[4..7],
        <53, 2, 1>[0..0] -> <10, 0, 0>[8..8],
        <53, 2, 1>[2..5] -> <10, 0, 0>[9..12]
    */
    const renamingMap = generateRenamingMap()

    const idAtEpoch1 = idFactory(10, 0, 0, 4, -5, -5, 0, 0)
    const idAtEpoch0 = renamingMap.reverseRenameId(idAtEpoch1)
    t.deepEqual(renamingMap.initRenameIds([idAtEpoch0])[0], idAtEpoch1)
})

test(`renameId(reverseRenameId(id)) returns id with
    id causally inserted to rename op,
    id = newPredId + tail,
    tail < succId`, (t) => {

    /*
        <10, -6, 0>[0..3] -> <10, 0, 0>[0..3],
        <42, 1, 5>[6..9] -> <10, 0, 0>[4..7],
        <53, 2, 1>[0..0] -> <10, 0, 0>[8..8],
        <53, 2, 1>[2..5] -> <10, 0, 0>[9..12]
    */
    const renamingMap = generateRenamingMap()

    const idAtEpoch1 = idFactory(10, 0, 0, 4, 77, 77, 0, 0)
    const idAtEpoch0 = renamingMap.reverseRenameId(idAtEpoch1)
    t.deepEqual(renamingMap.initRenameIds([idAtEpoch0])[0], idAtEpoch1)
})

test(`renameId(reverseRenameId(id)) returns id with
    id causally inserted to rename op,
    newLastId < id < lastId`, (t) => {

    /*
        <10, -6, 0>[0..3] -> <10, 0, 0>[0..3],
        <42, 1, 5>[6..9] -> <10, 0, 0>[4..7],
        <53, 2, 1>[0..0] -> <10, 0, 0>[8..8],
        <53, 2, 1>[2..5] -> <10, 0, 0>[9..12]
    */
    const renamingMap = generateRenamingMap()

    const idAtEpoch1 = idFactory(33, 33, 0, 0)
    const idAtEpoch0 = renamingMap.reverseRenameId(idAtEpoch1)
    t.deepEqual(renamingMap.initRenameIds([idAtEpoch0])[0], idAtEpoch1)
})

test(`renameId() retains order between id3 and id2 with
    newLastId < id1 < id3 < id2 < lastId,
    id1 causally inserted to rename op, newLastId < id1 < lastId,
    id2 concurrently inserted to rename op, id2 = lastId + MIN_TUPLE_USER + tail,
    id3 causally inserted to undo of the rename op between id1 and id2,
    id3 = lastId + MIN_TUPLE + tail'
    and lastId < tail'`, (t) => {
    /*
        <10, -6, 0>[0..3] -> <10, 0, 0>[0..3],
        <42, 1, 5>[6..9] -> <10, 0, 0>[4..7],
        <53, 2, 1>[0..0] -> <10, 0, 0>[8..8],
        <53, 2, 1>[2..5] -> <10, 0, 0>[9..12]
    */
    const renamingMap = generateRenamingMap()

    const id1AtEpoch1 = idFactory(52, 52, 0, 0)
    const id1AtEpoch0 = renamingMap.reverseRenameId(id1AtEpoch1)

    const id2AtEpoch0 = idFactory(53, 2, 1, 5, INT32_BOTTOM_USER, 0, 0, 0, 77, 77, 0, 0)
    const id2AtEpoch1 = renamingMap.initRenameIds([id2AtEpoch0])[0]

    const expectedOrder12 = Ordering.Less
    const actualOrder12AtEpoch0 = id1AtEpoch0.compareTo(id2AtEpoch0)
    const actualOrder12AtEpoch1 = id1AtEpoch1.compareTo(id2AtEpoch1)
    t.is(actualOrder12AtEpoch0, expectedOrder12)
    t.is(actualOrder12AtEpoch1, expectedOrder12)

    const id3AtEpoch0 = createBetweenPosition(id1AtEpoch0, id2AtEpoch0, 100, 0)
    const id3AtEpoch1 = renamingMap.initRenameIds([id3AtEpoch0])[0]

    const expectedOrder13 = Ordering.Less
    const actualOrder13AtEpoch0 = id1AtEpoch1.compareTo(id3AtEpoch0)
    const actualOrder13AtEpoch1 = id1AtEpoch1.compareTo(id3AtEpoch1)
    t.is(actualOrder13AtEpoch0, expectedOrder13)
    t.is(actualOrder13AtEpoch1, expectedOrder13)

    const expectedOrder32 = Ordering.Less
    const actualOrder32AtEpoch0 = id3AtEpoch0.compareTo(id2AtEpoch0)
    const actualOrder32AtEpoch1 = id3AtEpoch1.compareTo(id2AtEpoch1)
    t.is(actualOrder32AtEpoch0, expectedOrder32)
    t.is(actualOrder32AtEpoch1, expectedOrder32)
})
