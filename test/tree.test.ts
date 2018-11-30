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
import * as fs from "fs"

import {LogootSRopes} from "../src/logootsropes.js"

function getLogootSRopesFromTree (file: string): LogootSRopes | null {
    const data = fs.readFileSync(file, "utf8")
    const tree = JSON.parse(data)

    if (tree !== null && typeof tree === "object") {
        return LogootSRopes.fromPlain(0, 0, tree)
    }
    return null
}

test.failing("non-convergent-balanced-trees-different-digests", (t) => {
    const docs: LogootSRopes[] = []

    const files = [
        "trees/trees-nct/tree-nct-nikita-button-shirt-1.json",
        "trees/trees-nct/tree-nct-nikita-button-shirt-2.json",
    ]

    files.forEach((file) => {
        const data = fs.readFileSync(file, "utf8")
        const tree = JSON.parse(data)

        const doc: LogootSRopes | null = getLogootSRopesFromTree(file)

        if (doc !== null) {
            docs.push(doc)
        } else {
            t.fail("the file must contains a valid serialization of a LogootSRopes")
        }
    })

    const digests: number [] = docs.map((doc: LogootSRopes) => doc.digest())
    const allDifferents: boolean = digests.every((digest, index) => {
        return digests.every((otherDigest, otherIndex) => {
            return index === otherIndex || digest !== otherDigest
        })
    })

    t.true(allDifferents)
})
