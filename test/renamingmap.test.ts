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

import {flatten} from "../src/helpers"
import {Identifier} from "../src/identifier"
import {IdentifierInterval} from "../src/identifierinterval"
import {ExtendedRenamingMap} from "../src/renamingmap/extendedrenamingmap"
import {generateIdIntervalFactory, idFactory} from "./helpers"

test("constructor-simple-case", (t) => {
    const renamedIdIntervals = [generateIdIntervalFactory(0, 0, 0, -2)(3)]
    const expectedIds = [
        idFactory(0, 0, 0, -2),
        idFactory(0, 0, 0, -1),
        idFactory(0, 0, 0, 0),
        idFactory(0, 0, 0, 1),
        idFactory(0, 0, 0, 2),
        idFactory(0, 0, 0, 3),
    ]

    const renamingMap = new ExtendedRenamingMap(1, 1, renamedIdIntervals)

    t.deepEqual(renamingMap.renamedIds, expectedIds, "renamingMap.renamedIds = expectedIds")
})

test("constructor-more-complex-case", (t) => {
    const renamedIdIntervals = [
        generateIdIntervalFactory(0, 0, 0, -2)(1),
        generateIdIntervalFactory(0, 0, 0, 1, 42, 2, 0, 0)(3),
        generateIdIntervalFactory(0, 0, 0, 2)(3),
    ]
    const expectedIds = [
        idFactory(0, 0, 0, -2),
        idFactory(0, 0, 0, -1),
        idFactory(0, 0, 0, 0),
        idFactory(0, 0, 0, 1),
        idFactory(0, 0, 0, 1, 42, 2, 0, 0),
        idFactory(0, 0, 0, 1, 42, 2, 0, 1),
        idFactory(0, 0, 0, 1, 42, 2, 0, 2),
        idFactory(0, 0, 0, 1, 42, 2, 0, 3),
        idFactory(0, 0, 0, 2),
        idFactory(0, 0, 0, 3),
    ]

    const renamingMap = new ExtendedRenamingMap(1, 1, renamedIdIntervals)

    t.deepEqual(renamingMap.renamedIds, expectedIds, "renamingMap.renamedIds = expectedIds")
})

test("renameId-of-renamed-id", (t) => {
    const renamedIdIntervals = [generateIdIntervalFactory(0, 0, 0, -2)(3)]
    const renamingMap = new ExtendedRenamingMap(1, 1, renamedIdIntervals)

    const renamedId = idFactory(0, 0, 0, 1)
    const expectedNewId = idFactory(0, 1, 1, 3)

    const actualNewId = renamingMap.renameId(renamedId)

    t.deepEqual(actualNewId, expectedNewId, "actualId = expectedNewId")
})

test("renameId-of-concurrently-generated-id-before", (t) => {
    const renamedIdIntervals = [generateIdIntervalFactory(0, 0, 0, -2)(3)]
    const renamingMap = new ExtendedRenamingMap(1, 1, renamedIdIntervals)

    const idToRename = idFactory(-42, 2, 0, 0)
    const expectedNewId = idFactory(-10, 1, 1, 0, -42, 2, 0, 0)

    const actualNewId = renamingMap.renameId(idToRename)

    t.deepEqual(actualNewId, expectedNewId, "actualId = expectedNewId")
})

test("renameId-of-concurrently-generated-id-splitting", (t) => {
    const renamedIdIntervals = [generateIdIntervalFactory(0, 0, 0, -2)(3)]
    const renamingMap = new ExtendedRenamingMap(1, 1, renamedIdIntervals)

    const idToRename = idFactory(0, 0, 0, 1, 42, 2, 0, 0)
    const expectedNewId = idFactory(0, 1, 1, 3, 0, 0, 0, 1, 42, 2, 0, 0)

    const actualNewId = renamingMap.renameId(idToRename)

    t.deepEqual(actualNewId, expectedNewId, "actualId = expectedNewId")
})

test("renameId-of-concurrently-generated-id-after", (t) => {
    const renamedIdIntervals = [generateIdIntervalFactory(0, 0, 0, -2)(3)]
    const renamingMap = new ExtendedRenamingMap(1, 1, renamedIdIntervals)

    const idToRename = idFactory(42, 2, 0, 0)
    const expectedNewId = idFactory(0, 1, 1, 5, 42, 2, 0, 0)

    const actualNewId = renamingMap.renameId(idToRename)

    t.deepEqual(actualNewId, expectedNewId, "actualId = expectedNewId")
})

test.failing("renameId-then-reverseRenameId-of-renamed-id", (t) => {
    const renamedIdIntervals = [
        generateIdIntervalFactory(0, 0, 0, 0)(3),
        generateIdIntervalFactory(42, 1, 5, 6)(9),
        generateIdIntervalFactory(53, 2, 1, 0)(5),
    ]
    const renamingMap = new ExtendedRenamingMap(3, 0, renamedIdIntervals)

    const idsToRename = renamedIdIntervals
        .map((idInterval: IdentifierInterval): Identifier[] => idInterval.toIds())
        .reduce(flatten)

    idsToRename.forEach((expectedId: Identifier) => {
        const actualId = renamingMap.reverseRenameId(renamingMap.renameId(expectedId))
        t.deepEqual(actualId, expectedId, "reverseRenameId(renameId(id)) = id")
    })
})

test.failing("renameId-then-reverseRenameId-of-concurrently-generated-id-before", (t) => {
    const renamedIdIntervals = [
        generateIdIntervalFactory(0, 0, 0, 0)(3),
        generateIdIntervalFactory(42, 1, 5, 6)(9),
        generateIdIntervalFactory(53, 2, 1, 0)(5),
    ]
    const renamingMap = new ExtendedRenamingMap(3, 0, renamedIdIntervals)

    const expectedId = idFactory(-70, 0, 1, 0)

    const actualId = renamingMap.reverseRenameId(renamingMap.renameId(expectedId))
    t.deepEqual(actualId, expectedId, "reverseRenameId(renameId(id)) = id")
})

test.failing("renameId-then-reverseRenameId-of-concurrently-generated-id-splitting", (t) => {
    const renamedIdIntervals = [
        generateIdIntervalFactory(0, 0, 0, 0)(3),
        generateIdIntervalFactory(42, 1, 5, 6)(9),
        generateIdIntervalFactory(53, 2, 1, 0)(5),
    ]
    const renamingMap = new ExtendedRenamingMap(3, 0, renamedIdIntervals)

    const expectedId = idFactory(42, 1, 5, 8, 7, 0, 1, 0)

    const actualId = renamingMap.reverseRenameId(renamingMap.renameId(expectedId))
    t.deepEqual(actualId, expectedId, "reverseRenameId(renameId(id)) = id")
})

test.failing("renameId-then-reverseRenameId-of-concurrently-generated-id-after", (t) => {
    const renamedIdIntervals = [
        generateIdIntervalFactory(0, 0, 0, 0)(3),
        generateIdIntervalFactory(42, 1, 5, 6)(9),
        generateIdIntervalFactory(53, 2, 1, 0)(5),
    ]
    const renamingMap = new ExtendedRenamingMap(3, 0, renamedIdIntervals)

    const expectedId = idFactory(70, 0, 1, 0)

    const actualId = renamingMap.reverseRenameId(renamingMap.renameId(expectedId))
    t.deepEqual(actualId, expectedId, "reverseRenameId(renameId(id)) = id")
})
