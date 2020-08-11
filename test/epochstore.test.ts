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
import { ExecutionContext } from "ava"

import { Epoch } from "../src/epoch/epoch"
import { EpochId } from "../src/epoch/epochid"
import { compareEpochFullIds, EpochStore } from "../src/epoch/epochstore"
import { Ordering } from "../src/ordering"

function generateEpoch (replicaNumber: number, epochNumber: number, parentEpoch: Epoch): Epoch {
    return new Epoch(new EpochId(replicaNumber, epochNumber), parentEpoch.id)
}

function generateEpochStore (): EpochStore {
    const origin = new Epoch(new EpochId(0, 0))
    const epochA1 = generateEpoch(1, 1, origin)
    const epochA2 = generateEpoch(1, 2, epochA1)
    const epochB1 = generateEpoch(2, 1, origin)
    const epochB2 = generateEpoch(2, 2, epochB1)
    const epochA3 = generateEpoch(1, 3, epochB2)

    const epochs = [
        epochA1,
        epochA2,
        epochB1,
        epochB2,
        epochA3,
    ]

    const expectedEpochStore = new EpochStore(origin)
    epochs.forEach((epoch) => expectedEpochStore.addEpoch(epoch))
    return expectedEpochStore
}

test("epochStore-from-plain-factory", (t: ExecutionContext) => {
    const expectedEpochStore = generateEpochStore()

    const actualEpochStore =
        EpochStore.fromPlain(expectedEpochStore.toJSON())

    if (actualEpochStore === null) {
        t.fail("The EpochStore should have been correctly instantiated")
    } else {
        t.deepEqual(actualEpochStore, expectedEpochStore)
    }
})

test("compare-epoch-full-ids", (t) => {
    t.is(compareEpochFullIds([0, 0], [0, 0]), Ordering.Equal)

    t.is(compareEpochFullIds([0, 0], [0, 0, 1, 1]), Ordering.Less)
    t.is(compareEpochFullIds([0, 0, 1, 1], [0, 0]), Ordering.Greater)

    t.is(compareEpochFullIds([0, 0, 1, 1], [0, 0, 2, 1]), Ordering.Less)
    t.is(compareEpochFullIds([0, 0, 2, 1], [0, 0, 1, 1]), Ordering.Greater)

    t.is(compareEpochFullIds([0, 0], [0, 0, -1, 1]), Ordering.Less)
    t.is(compareEpochFullIds([0, 0, -1, 1], [0, 0]), Ordering.Greater)

    t.is(compareEpochFullIds([0, 0, -2, 1], [0, 0, -1, 1]), Ordering.Less)
    t.is(compareEpochFullIds([0, 0, -1, 1], [0, 0, -2, 1]), Ordering.Greater)
})
