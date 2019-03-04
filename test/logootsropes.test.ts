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
import { Identifier } from "../src/identifier"
import { IdentifierTuple } from "../src/identifiertuple"
import { LogootSRopes } from "../src/logootsropes.js"
import { LogootSAdd } from "../src/operations/insert/logootsadd"

test("fromPlain-empty-doc", (t) => {
    const replicaNumber = 1
    const clock = 42

    const plainEmptyDoc = {
        replicaNumber,
        clock,
        root: null,
        str: "",
    }

    const doc = LogootSRopes.fromPlain(replicaNumber, clock, plainEmptyDoc)

    if (doc === null) {
        t.fail("The doc should have been correctly instantiated")
    } else {
        t.is(doc.replicaNumber, replicaNumber)
        t.is(doc.clock, clock)
        t.is(doc.root, null)
        t.is(doc.str, "")
    }
})

test("basic-insert-del-string", (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)
    const replicaNumberB = 2
    const docB = new LogootSRopes(replicaNumberB)

    const event1 = docA.insertLocal(0, "hello world")
    const event2 = docA.delLocal(6, 9)

    event1.execute(docB)
    event2.execute(docB)

    t.is(docA.str, docB.str, "docA.str = docB.str")
    t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test("nested-splits", (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)
    const replicaNumberB = 2
    const docB = new LogootSRopes(replicaNumberB)

    const insertOp1 = docA.insertLocal(0, "hello world")
    insertOp1.execute(docB)

    const insertOp2 = docB.insertLocal(5, "SPLIT")
    insertOp2.execute(docA)

    const insertOp3 = docB.insertLocal(6, "split")
    insertOp3.execute(docA)

    t.is(docA.str, docB.str, "docA.str = docB.str")
    t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test("deletion-over-several-identifiers", (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)
    const replicaNumberB = 2
    const docB = new LogootSRopes(replicaNumberB)

    const insertOp1 = docA.insertLocal(0, "world")
    insertOp1.execute(docB)

    const insertOp2 = docB.insertLocal(0, "hello ")
    insertOp2.execute(docA)

    const deleteOp = docA.delLocal(4, 3 + "lo wor".length)
    deleteOp.execute(docB)

    t.is(docA.str, docB.str, "docA.str = docB.str")
    t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test("insert-should-append-to-splitting-block", (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)

    // Insert the initial block
    const event1 = docA.insertLocal(0, "hello world")

    // Split the root and generate a new block
    const event2 = docA.insertLocal(5, "X")
    // Append some text to the previous block
    const event3 = docA.insertLocal(6, "YZ")

    t.is(docA.str, "helloXYZ world", "docA.str = 'helloXYZ world'")
    t.deepEqual(event2.id.base, event3.id.base, "event2.id.base = event3.id.base")
})

test("insert-should-prepend-to-splitting-block", (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)

    // Insert the initial block
    const event1 = docA.insertLocal(0, "hello world")

    // Split the root and generate a new block
    const event2 = docA.insertLocal(5, "YZ")
    // Prepend some text to the previous block
    const event3 = docA.insertLocal(5, "X")

    t.is(docA.str, "helloXYZ world", "docA.str = 'helloXYZ world'")
    t.deepEqual(event2.id.base, event3.id.base, "event2.id.base = event3.id.base")
})

test("commutative-insert1-insert2", (t) => {
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

test("idempotent-insert-after-split", (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)
    const replicaNumberB = 2
    const docB = new LogootSRopes(replicaNumberB)

    const insertOp1 = docA.insertLocal(0, "hello world")
    insertOp1.execute(docB)

    const insertOp2 = docB.insertLocal(5, "SPLIT")
    insertOp2.execute(docA)

    insertOp1.execute(docB)

    t.is(docA.str, docB.str, "docA.str = docB.str")
    t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test.failing("commutative-insert-deletion", (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)
    const replicaNumberB = 2
    const docB = new LogootSRopes(replicaNumberB)

    const insertOp = docA.insertLocal(0, "hello world")
    const deleteOp = docA.delLocal(5, 5 + " world".length)

    deleteOp.execute(docB)
    insertOp.execute(docB)

    t.is(docA.str, docB.str, "docA.str = docB.str")
    t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test("commutative-insert-split", (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)
    const replicaNumberB = 2
    const docB = new LogootSRopes(replicaNumberB)

    const insertOp = docA.insertLocal(0, "hello world")
    const splitOp = docA.insertLocal(5, "SPLIT")

    splitOp.execute(docB)
    insertOp.execute(docB)

    t.is(docA.str, docB.str, "docA.str = docB.str")
    t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test("commutative-deletion-split", (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)
    const replicaNumberB = 2
    const docB = new LogootSRopes(replicaNumberB)

    const insertOp = docA.insertLocal(0, "hello world")
    insertOp.execute(docB)

    const deleteOp = docA.delLocal(4, 3 + "o wor".length)
    const splitOp = docB.insertLocal(5, "SPLIT")
    splitOp.execute(docA)
    deleteOp.execute(docB)

    t.is(docA.str, docB.str, "docA.str = docB.str")
    t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test.failing("commutative-split-deletion", (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)
    const replicaNumberB = 2
    const docB = new LogootSRopes(replicaNumberB)

    const insertOp = docA.insertLocal(0, "hello world")
    const splitOp = docA.insertLocal(5, "SPLIT")
    const deleteOp = docA.delLocal(5, 4 + "SPLIT".length)

    splitOp.execute(docB)
    deleteOp.execute(docB)
    insertOp.execute(docB)

    t.is(docA.str, docB.str, "docA.str = docB.str")
    t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test("commutative-insert-append", (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)
    const replicaNumberB = 2
    const docB = new LogootSRopes(replicaNumberB)

    const insertOp = docA.insertLocal(0, "hello world")
    const appendOp = docA.insertLocal(11, "APPEND")

    appendOp.execute(docB)
    insertOp.execute(docB)

    t.is(docA.str, docB.str, "docA.str = docB.str")
    t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test.failing("commutative-append1-append2", (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)
    const replicaNumberB = 2
    const docB = new LogootSRopes(replicaNumberB)

    const insertOp = docA.insertLocal(0, "hello world")
    const appendOp1 = docA.insertLocal(11, "1")
    const appendOp2 = docA.insertLocal(12, "2")

    insertOp.execute(docB)
    appendOp2.execute(docB)
    appendOp1.execute(docB)

    t.is(docA.str, docB.str, "docA.str = docB.str")
    t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test("commutative-insert-append-split-1", (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)

    const insertOp = docA.insertLocal(0, "hello")
    const appendOp = docA.insertLocal(5, " world")
    const splitOp = docA.insertLocal(7, "SPLIT")

    const replicaNumberB = 2
    const docB = new LogootSRopes(replicaNumberB)

    insertOp.execute(docB)
    splitOp.execute(docB)
    appendOp.execute(docB)

    t.is(docA.str, docB.str, "docA.str = docB.str")
    t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test("commutative-insert-append-split-2", (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)

    const insertOp = docA.insertLocal(0, "hello")
    const appendOp = docA.insertLocal(5, " world")
    const splitOp = docA.insertLocal(7, "SPLIT")

    const replicaNumberB = 2
    const docB = new LogootSRopes(replicaNumberB)

    splitOp.execute(docB)
    appendOp.execute(docB)
    insertOp.execute(docB)

    t.is(docA.str, docB.str, "docA.str = docB.str")
    t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test("commutative-insert-append-split-3", (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)

    const insertOp = docA.insertLocal(0, "hello")
    const appendOp = docA.insertLocal(5, " world")
    const splitOp = docA.insertLocal(7, "SPLIT")

    const replicaNumberB = 2
    const docB = new LogootSRopes(replicaNumberB)

    splitOp.execute(docB)
    insertOp.execute(docB)
    appendOp.execute(docB)

    t.is(docA.str, docB.str, "docA.str = docB.str")
    t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test("commutative-insert-append-split-4", (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)

    const insertOp = docA.insertLocal(0, "hello")
    const appendOp = docA.insertLocal(5, " world")
    const splitOp = docA.insertLocal(7, "SPLIT")

    const replicaNumberB = 2
    const docB = new LogootSRopes(replicaNumberB)

    appendOp.execute(docB)
    splitOp.execute(docB)
    insertOp.execute(docB)

    t.is(docA.str, docB.str, "docA.str = docB.str")
    t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test("commutative-insert-append-split-5", (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)

    const insertOp = docA.insertLocal(0, "hello")
    const appendOp = docA.insertLocal(5, " world")
    const splitOp = docA.insertLocal(7, "SPLIT")

    const replicaNumberB = 2
    const docB = new LogootSRopes(replicaNumberB)

    appendOp.execute(docB)
    insertOp.execute(docB)
    splitOp.execute(docB)

    t.is(docA.str, docB.str, "docA.str = docB.str")
    t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test("commutative-insert-append-split-6", (t) => {
    const replicaNumberA = 1
    const replicaNumberB = 2
    const replicaNumberC = 3

    const plainDoc = {
        replicaNumber: 1,
        clock: 1,
        root: {
            // "Hello"
            block: {
                idInterval: {
                    idBegin: {
                        tuples: [{
                            random: 0,
                            replicaNumber: replicaNumberA,
                            clock: 0,
                            offset: 0,
                        }],
                    },
                    end: 4,
                },
                nbElement: 5,
            },
            actualBegin: 0,
            length: 5,
            left: null,
            right: {
                // "!""
                block: {
                    idInterval: {
                        idBegin: {
                            tuples: [{
                                random: 42,
                                replicaNumber: replicaNumberC,
                                clock: 0,
                                offset: 0,
                            }],
                        },
                        end: 0,
                    },
                    nbElement: 1,
                },
                actualBegin: 0,
                length: 1,
                right: null,
                left: {
                    // "SPLIT"
                    block: {
                        idInterval: {
                            idBegin: {
                                tuples: [{
                                    random: 0,
                                    replicaNumber: replicaNumberA,
                                    clock: 0,
                                    offset: 4,
                                }, {
                                    random: 7,
                                    replicaNumber: replicaNumberB,
                                    clock: 0,
                                    offset: 0,
                                }],
                            },
                            end: 4,
                        },
                        nbElement: 5,
                    },
                    actualBegin: 0,
                    length: 5,
                    left: null,
                    right: null,
                },
            },
        },
        str: "HelloSPLIT!",
    }

    const docC = LogootSRopes.fromPlain(replicaNumberC, 1, plainDoc)

    if (docC === null) {
        t.fail("The doc should have been correctly instantiated")
    } else {
        const appendOp = new LogootSAdd(new Identifier([new IdentifierTuple(0, replicaNumberA, 0, 5)]), "world")
        appendOp.execute(docC)

        const expectedString = "HelloSPLITworld!"
        t.is(docC.str, expectedString)
    }
})

test("commutative-deletion1-deletion2", (t) => {
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

    t.is(docA.str, docB.str, "docA.str = docB.str")
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

// NOTE: Failing since the trees are not balanced the same way
test.failing("convergent-trees", (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)
    const replicaNumberB = 2
    const docB = new LogootSRopes(replicaNumberB)

    const insertOp1 = docA.insertLocal(0, "a\n")
    insertOp1.execute(docB)

    const insertOp2 = docB.insertLocal(2, "c")
    insertOp2.execute(docA)

    // Simulate concurrency
    const insertOp3 = docA.insertLocal(3, "d")
    const insertOp4 = docB.insertLocal(1, "b")

    insertOp3.execute(docB)
    insertOp4.execute(docA)

    const expectedString = "ab\ncd"

    t.is(docA.str, docB.str)
    t.is(docA.str, expectedString)
    t.is(docA.digest(), docB.digest())
    if (docA.root !== null && docB.root !== null) {
        const str1 = docA.root.toString()
        const str2 = docB.root.toString()
        t.true(str1 === str2)
    } else {
        t.fail("The models must not be null")
    }
})

test("append-replayed-as-insert" , (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)
    const replicaNumberB = 2
    const docB = new LogootSRopes(replicaNumberB)

    const insertOp1 = docA.insertLocal(0, "a")
    const insertOp2 = docA.insertLocal(1, "c")
    const insertOp3 = docA.insertLocal(1, "b")

    insertOp1.execute(docB)
    insertOp3.execute(docB)
    insertOp2.execute(docB)

    const expectedString = "abc"

    t.is(docA.str, docB.str)
    t.is(docA.str, expectedString)
    t.is(docA.digest(), docB.digest())
})

test("prepend-replayed-as-insert" , (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)
    const replicaNumberB = 2
    const docB = new LogootSRopes(replicaNumberB)

    const insertOp1 = docA.insertLocal(0, "a")
    const insertOp2 = docA.insertLocal(1, "c")
    const insertOp3 = docA.insertLocal(1, "b")

    insertOp2.execute(docB)
    insertOp3.execute(docB)
    insertOp1.execute(docB)

    const expectedString = "abc"

    t.is(docA.str, expectedString)
    t.is(docA.str, docB.str)
    t.is(docA.digest(), docB.digest())
})
