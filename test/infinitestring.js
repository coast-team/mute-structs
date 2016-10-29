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
import {InfiniteString} from "../lib/infinitestring.js"

test("has-next-prefix-less", (t) => {
    const repeatredValue = Symbol()
    const stream = new InfiniteString([], repeatredValue)

    t.true(stream.hasNext())
})

test("has-next-prefix-less-null-value", (t) => {
    const repeatredValue = null
    const stream = new InfiniteString([], repeatredValue)

    t.true(stream.hasNext())
})

test("next-prefix-less", (t) => {
    const repeatredValue = Symbol()
    const stream = new InfiniteString([], repeatredValue)

    t.is(stream.next(), repeatredValue)
})

test("next-with-prefix", (t) => {
    const repeatredValue = Symbol()
    const prefix = [Symbol(), Symbol()]
    const stream = new InfiniteString(prefix, repeatredValue)

    t.is(stream.next(), prefix[0])
    t.is(stream.next(), prefix[1])
    t.is(stream.next(), repeatredValue)
})

