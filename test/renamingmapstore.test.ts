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
import { AssertContext } from "ava"

import { RenamingMapStore } from "../src/renamingmap/renamingmapstore"
import { generateRenamableReplicableList } from "./renamablereplicablelist.test"

function generateRenamingMapStore (): RenamingMapStore {
    return generateRenamableReplicableList().renamingMapStore
}

test("renamingMapStore-from-plain-factory", (t: AssertContext) => {
    const expectedRenamingMapStore = generateRenamingMapStore()

    const actualRenamingMapStore =
        RenamingMapStore.fromPlain(expectedRenamingMapStore.toJSON())

    if (actualRenamingMapStore === null) {
        t.fail("The RenamingMapStore should have been correctly instantiated")
    } else {
        t.deepEqual(actualRenamingMapStore, expectedRenamingMapStore)
    }
})
