import test from "ava"
import {AssertContext} from "ava"
import * as fs from "fs"
import {SafeAny} from "safe-any"

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
        "trees/trees-nct/tree-nct-tornado-candid-mayday-chrome.json",
        "trees/trees-nct/tree-nct-tornado-candid-mayday-mac.json"
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
