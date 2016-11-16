/*
 *	Copyright 2016 Gerald Oster
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
import {LogootSRopes} from "../lib/logootsropes.js"
import TextUtils from "../lib/textutils.js"

test("basic-insert-del-string", (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)
    const replicaNumberB = 2
    const docB = new LogootSRopes(replicaNumberB)

    const event1 = docA.insertLocal(0, "hello world")
    const event2 = docA.delLocal(6, 9)

    const textop_seq1 = event1.execute(docB)
    const textop_seq2 = event2.execute(docB)

    // str attribute is not updated when apply LogootS operations (see issue #4)
    // Array.prototype.forEach.call(textop_seq1.concat(textop_seq2), to => {
    textop_seq1.concat(textop_seq2).forEach(to => {
          // Must identify which type of text operation it is
          if(to.content !== undefined && to.offset !== undefined &&
            to.content !== null && to.offset !== null) {
              // Insertion
              docB.str = TextUtils.insert(docB.str, to.offset, to.content)
          }
          else if(to.length !== undefined && to.length !== null &&
                 to.offset !== undefined && to.offset !== null) {
              // Deletion
              docB.str = TextUtils.del(docB.str, to.offset, to.offset + to.length - 1)
          }
    })

    t.is(docA.str, docB.str, "docA.str = docB.str")
    t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test("commutative-insert", (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)
    const replicaNumberB = 2
    const docB = new LogootSRopes(replicaNumberB)

    const a1 = docA.insertLocal(0, "hello world")
    const b1 = docB.insertLocal(0, "Hello!")

    const a1TxtOps = a1.execute(docB)
    const b1TxtOps = b1.execute(docA)

    t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test("idempotent-insert", (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)
    const replicaNumberB = 2
    const docB = new LogootSRopes(replicaNumberB)

    const a1 = docA.insertLocal(0, "hello world")

    a1.execute(docB)
    a1.execute(docB)

    t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test("commutative-deletion", (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)
    const replicaNumberB = 2
    const docB = new LogootSRopes(replicaNumberB)

    const a1 = docA.insertLocal(0, "hello world")
    a1.execute(docB)

    const a2 = docA.delLocal(0, 3)
    const b1 = docB.delLocal(6, 9)
    const a2TxtOps = a2.execute(docB)
    const b1TxtOps = b1.execute(docA)

    t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test("idempotent-deletion", (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)
    const replicaNumberB = 2
    const docB = new LogootSRopes(replicaNumberB)

    const a1 = docA.insertLocal(0, "hello world")
    a1.execute(docB)

    const a2 = docA.delLocal(0, 3)
    a2.execute(docB)
    a2.execute(docB)

    t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})
