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

test("getNewId-of-renamed-id", (t) => {
    const renamedIdIntervals = [generateIdIntervalFactory(0, 0, 0, -2)(3)]
    const renamingMap = new ExtendedRenamingMap(1, 1, renamedIdIntervals)

    const renamedId = idFactory(0, 0, 0, 1)
    const expectedNewId = idFactory(0, 1, 1, 3)

    const actualNewId = renamingMap.getNewId(renamedId)

    t.deepEqual(actualNewId, expectedNewId, "actualId = expectedNewId")
})

test("getNewId-of-concurrently-generated-id-before", (t) => {
    const renamedIdIntervals = [generateIdIntervalFactory(0, 0, 0, -2)(3)]
    const renamingMap = new ExtendedRenamingMap(1, 1, renamedIdIntervals)

    const idToRename = idFactory(-42, 2, 0, 0)
    const expectedNewId = idFactory(-10, 1, 1, 0, -42, 2, 0, 0)

    const actualNewId = renamingMap.getNewId(idToRename)

    t.deepEqual(actualNewId, expectedNewId, "actualId = expectedNewId")
})

test("getNewId-of-concurrently-generated-id-splitting", (t) => {
    const renamedIdIntervals = [generateIdIntervalFactory(0, 0, 0, -2)(3)]
    const renamingMap = new ExtendedRenamingMap(1, 1, renamedIdIntervals)

    const idToRename = idFactory(0, 0, 0, 1, 42, 2, 0, 0)
    const expectedNewId = idFactory(0, 1, 1, 3, 0, 0, 0, 1, 42, 2, 0, 0)

    const actualNewId = renamingMap.getNewId(idToRename)

    t.deepEqual(actualNewId, expectedNewId, "actualId = expectedNewId")
})

test("getNewId-of-concurrently-generated-id-after", (t) => {
    const renamedIdIntervals = [generateIdIntervalFactory(0, 0, 0, -2)(3)]
    const renamingMap = new ExtendedRenamingMap(1, 1, renamedIdIntervals)

    const idToRename = idFactory(42, 2, 0, 0)
    const expectedNewId = idFactory(0, 1, 1, 5, 42, 2, 0, 0)

    const actualNewId = renamingMap.getNewId(idToRename)

    t.deepEqual(actualNewId, expectedNewId, "actualId = expectedNewId")
})
