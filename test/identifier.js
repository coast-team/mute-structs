/*
 *	Copyright 2016 Victorien Elvinger
 *
 *	This program is free software: you can redistribute it and/or modify
 *	it under the terms of the GNU General Public License as published by
 *	the Free Software Foundation, either version 3 of the License, or
 * 	(at your option) any later version.
 *
 *	This program is distributed in the hope that it will be useful,
 *	but WITHOUT ANY WARRANTY; without even the implied warranty of
 *	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *	GNU General Public License for more details.
 *
 *	You should have received a copy of the GNU General Public License
 *	along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import test from "ava"
import Identifier from "../lib/identifier.js"

test("compare-to-last", (t) => {
    const id1 = new Identifier([], 4)
    const id1Twin = new Identifier([], 4)
    const id2 = new Identifier([], 1)
    const id3 = new Identifier([], 9)

    t.is(id1.compareTo(id1Twin), 0)
    t.not(id1.compareTo(id2), -1)
    t.not(id1.compareTo(id3), 1)
})

test("compare-to-base", (t) => {
    const last = 0
    const id1 = new Identifier([1, 2], last)
    const id1Twin = new Identifier([1, 2], last)
    const id2 = new Identifier([1, 2, 3], last)
    const id3 = new Identifier([1], last)
    const id4 = new Identifier([1, 3], last)
    const id5 = new Identifier([1, 1], last)

    t.is(id1.compareTo(id1Twin), 0)
    t.not(id1.compareTo(id2), 1)
    t.not(id1.compareTo(id3), -1)
    t.not(id1.compareTo(id4), 1)
    t.not(id1.compareTo(id5), -1)
})
