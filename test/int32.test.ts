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
import {ExecutionContext} from "ava"

import {
    INT32_BOTTOM,
    INT32_TOP,
    isInt32,
    randomInt32,
} from "../src/int32.js"

test("safe-integers-are-not-int32", (t: ExecutionContext) => {
    t.false(isInt32(Number.MIN_SAFE_INTEGER))
    t.false(isInt32(INT32_BOTTOM - 1))
    t.false(isInt32(INT32_TOP + 1))
    t.false(isInt32(Number.MAX_SAFE_INTEGER))
})

test("int32-are-int32", (t: ExecutionContext) => {
    t.true(isInt32(INT32_BOTTOM))
    t.true(isInt32(0))
    t.true(isInt32(INT32_TOP))
})

test("float-are-not-int32", (t: ExecutionContext) => {
    t.false(isInt32(-1.2))
    t.false(isInt32(0.1))
    t.false(isInt32(1.2))
})

test("randomInt32-upper-bound-is-excluded", (t: ExecutionContext) => {
    // WARNING: No deterministric test (no seeded radom function)
    for (let i = 0; i < 100; i++) {
        t.is(randomInt32(0, 1), 0)
        t.is(randomInt32(-1, 0), -1)
    }
})

test("randomInt32-in-interval", (t: ExecutionContext) => {
    // WARNING: No deterministric test (no seeded radom function)
    for (let i = 0; i < 100; i++) {
        const r = randomInt32(INT32_BOTTOM, INT32_TOP)
        t.true(isInt32(r) && r !== INT32_TOP)
    }
})
