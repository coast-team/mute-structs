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

import {isObject} from "./data-validation"
import { Identifier } from "./identifier"
import { IdentifierInterval } from "./identifierinterval"
import * as IDFactory from "./idfactory"
import { isInt32 } from "./int32"
import {
    compareBase,
    IdentifierIteratorResults,
} from "./iteratorhelperidentifier"
import { LogootSBlock } from "./logootsblock"
import { LogootSDel } from "./operations/delete/logootsdel"
import { TextDelete } from "./operations/delete/textdelete"
import { LogootSAdd } from "./operations/insert/logootsadd"
import { TextInsert } from "./operations/insert/textinsert"
import { ResponseIntNode } from "./responseintnode"
import { RopesNodes } from "./ropesnodes"
import * as TextUtils from "./textutils"

function leftChildOf (aNode: RopesNodes): RopesNodes | null {
    return aNode.left
}

function rightChildOf (aNode: RopesNodes): RopesNodes | null {
    return aNode.right
}

export class LogootSRopes {

    static empty (): LogootSRopes {
        return new LogootSRopes(0, 0)
    }

    static fromPlain (replica: number, clock: number, o: unknown): LogootSRopes | null {
        console.assert(isInt32(replica), "replica ∈ int32")
        console.assert(isInt32(clock), "clock ∈ int32")

        if (isObject<LogootSRopes>(o) &&
            typeof o.str === "string") {

            const root = RopesNodes.fromPlain(o.root)
            if ((root !== null && o.str.length === root.sizeNodeAndChildren) ||
                (root === null && o.str.length === 0)) {

                return new LogootSRopes(replica, clock, root, o.str)
            }
        }
        return null
    }

    readonly replicaNumber: number
    clock: number
    root: RopesNodes | null
    readonly mapBaseToBlock: { [key: string]: LogootSBlock }
    str: string

    constructor (replica = 0, clock = 0, root: RopesNodes | null = null, str = "") {
        console.assert(isInt32(replica), "replica ∈ int32")
        console.assert(isInt32(clock), "clock ∈ int32")

        this.replicaNumber = replica
        this.clock = clock
        this.root = root
        this.str = str

        const baseToBlock: { [key: string]: LogootSBlock } = {}
        if (root !== null) {
            console.assert(str.length === root.sizeNodeAndChildren,
                "str length must match the number of elements in the model")

            const blocks = root.getBlocks()

            for (const b of blocks) {
                const key = b.idInterval.base.join(",")
                baseToBlock[key] = b
            }
        } else {
            console.assert(str.length === 0,
                "str must be empty when no root is provided")
        }
        this.mapBaseToBlock = baseToBlock
    }

    get height (): number {
        return (this.root) ? this.root.height : 0
    }

    getBlock (idInterval: IdentifierInterval): LogootSBlock {
        const mapBaseToBlock = this.mapBaseToBlock
        const key = idInterval.base.join(",")
        let result

        if (mapBaseToBlock.hasOwnProperty(key)) {
            result = mapBaseToBlock[key]
        } else {
            result = new LogootSBlock(idInterval, 0)
            this.mapBaseToBlock[key] = result
        }

        return result
    }

    /**
     * Add a interval of identifiers and its corresponding string to the model
     *
     * @param {string} str The inserted string
     * @param {IdentifierInterval} idi The corresponding interval of identifiers
     * @param {RopesNodes} from The starting point of the search
     * @param {number} startOffset ???
     */
    addBlockFrom (
        str: string, idi: IdentifierInterval,
        from: RopesNodes, startOffset: number): TextInsert[] {

        const result: TextInsert[] = this.addBlockFromRec(str, idi, from, startOffset)
        result.forEach((textInsert: TextInsert) => {
            this.applyTextInsert(textInsert)
        })
        return result
    }

    addBlockFromRec (
        str: string, idi: IdentifierInterval,
        from: RopesNodes, startOffset: number): TextInsert[] {

        const author = idi.idBegin.replicaNumber
        const path: RopesNodes[] = []
        const result: TextInsert[] = []
        let con = true
        let i = startOffset
        while (con) {
            path.push(from)

            // B1 is the block we are adding
            // B2 is the block to which we are comparing
            switch (compareBase(idi, from.getIdentifierInterval())) {
            case IdentifierIteratorResults.B1_AFTER_B2: {
                if (from.right === null) {
                    from.right = RopesNodes.leaf(this.getBlock(idi),
                        idi.begin, str.length)
                    i = i + from.leftSubtreeSize() + from.length
                    result.push(new TextInsert(i, str, author))
                    con = false
                } else {
                    i = i + from.leftSubtreeSize() + from.length
                    from = from.right
                }
                break
            }
            case IdentifierIteratorResults.B1_BEFORE_B2: {
                if (from.left === null) {
                    from.left = RopesNodes.leaf(this.getBlock(idi),
                        idi.begin, str.length)
                    result.push(new TextInsert(i, str, author))
                    con = false
                } else {
                    from = from.left
                }
                break
            }
            case IdentifierIteratorResults.B1_INSIDE_B2: {
                // split b2 the object node
                const indexOffset: number = from.getIdBegin().length - 1
                const offsetToSplit = idi.idBegin.tuples[indexOffset].offset
                const rp = RopesNodes.leaf(this.getBlock(idi),
                    idi.begin, str.length)
                path.push(from.split(offsetToSplit - from.actualBegin + 1, rp))
                i = i + from.leftSubtreeSize()
                result.push(new TextInsert(i + offsetToSplit - from.actualBegin + 1, str, author))
                con = false
                break
            }
            case IdentifierIteratorResults.B2_INSIDE_B1: {
                // split b1 the node to insert
                const indexOffset: number = idi.idBegin.length - 1
                const offsetToSplit: number =
                    from.getIdBegin().tuples[indexOffset].offset
                let ls = str.substr(0, offsetToSplit + 1 - idi.begin)
                let idi1 = new IdentifierInterval(idi.idBegin, offsetToSplit)
                if (from.left === null) {
                    from.left = RopesNodes.leaf(this.getBlock(idi1),
                        idi1.begin, ls.length)
                    result.push(new TextInsert(i, ls, author))
                } else {
                    Array.prototype.push.apply(result,
                        this.addBlockFromRec(ls, idi1, from.left, i))
                }

                // i=i+ls.size()

                ls = str.substr(offsetToSplit + 1 - idi.begin, str.length)
                const newIdBegin =
                    Identifier.fromBase(idi.idBegin, offsetToSplit + 1)
                idi1 = new IdentifierInterval(newIdBegin, idi.end)
                i = i + from.leftSubtreeSize() + from.length
                if (from.right === null) {
                    from.right = RopesNodes.leaf(this.getBlock(idi1),
                        idi1.begin, ls.length)
                    result.push(new TextInsert(i, ls, author))
                } else {
                    Array.prototype.push.apply(result,
                        this.addBlockFromRec(ls, idi1, from.right, i))
                }
                con = false
                break
            }
            case IdentifierIteratorResults.B1_CONCAT_B2: {
                // node to insert concat the node
                if (from.left !== null) {
                    const split = from.getIdBegin().minOffsetAfterPrev(
                        from.left.max, idi.begin)
                    const l = str.substr(split - idi.begin, str.length)
                    if (l.length > 0) {
                        from.appendBegin(l.length)
                        result.push(new TextInsert(i + from.leftSubtreeSize(), l, author))

                        this.ascendentUpdate(path, l.length)
                    }

                    // check if previous is smaller or not
                    if ((split - 1) >= idi.begin) {
                        str = str.substr(0, split - idi.begin)
                        idi = new IdentifierInterval(idi.idBegin, split - 1)
                        from = from.left
                    } else {
                        con = false
                    }
                } else {
                    result.push(new TextInsert(i, str, author))
                    from.appendBegin(str.length)
                    this.ascendentUpdate(path, str.length)
                    con = false
                }

                break
            }
            case IdentifierIteratorResults.B2_CONCAT_B1: {
                // concat at end
                if (from.right !== null) {
                    const split = from.getIdEnd().maxOffsetBeforeNext(
                        from.right.min, idi.end)
                    const l = str.substr(0, split + 1 - idi.begin)
                    i = i + from.leftSubtreeSize() + from.length
                    if (l.length > 0) {
                        from.appendEnd(l.length)
                        result.push(new TextInsert(i, l, author))

                        this.ascendentUpdate(path, l.length)
                    }

                    if (idi.end >= (split + 1)) {
                        str = str.substr(split + 1 - idi.begin, str.length)
                        const newIdBegin =
                            Identifier.fromBase(idi.idBegin, split + 1)
                        idi = new IdentifierInterval(newIdBegin, idi.end)
                        from = from.right
                        i = i + l.length
                    } else {
                        con = false
                    }
                } else {
                    i = i + from.leftSubtreeSize() + from.length
                    result.push(new TextInsert(i, str, author))
                    from.appendEnd(str.length)
                    this.ascendentUpdate(path, str.length)
                    con = false
                }

                break
            }
            case IdentifierIteratorResults.B1_EQUALS_B2: {
                con = false
                break
            }
            }
        }
        this.balance(path)
        return result
    }

    // FIXME: Put this function elsewhere?
    applyTextInsert (textInsert: TextInsert): void {
        this.str = TextUtils.insert(this.str, textInsert.index, textInsert.content)
    }

    // FIXME: Put this function elsewhere?
    applyTextDelete (textDelete: TextDelete): void {
        const end: number = textDelete.index + textDelete.length - 1
        this.str = TextUtils.del(this.str, textDelete.index, end)
    }

    addBlock (str: string, id: Identifier): TextInsert[] {
        const author = id.replicaNumber
        const idi = new IdentifierInterval(id,
            id.lastOffset + str.length - 1)

        if (this.root === null) {
            const bl = new LogootSBlock(idi, 0)
            this.mapBaseToBlock[bl.idInterval.base.join(",")] = bl
            this.root = RopesNodes.leaf(bl, id.lastOffset, str.length)
            const textInsert: TextInsert = new TextInsert(0, str, author)
            this.applyTextInsert(textInsert)
            return [textInsert]
        } else {
            return this.addBlockFrom(str, idi, this.root, 0)
        }
    }

    mkNode (id1: Identifier | null, id2: Identifier | null, length: number): RopesNodes {
        console.assert(isInt32(length) && length > 0, "length ∈ int32")
        console.assert(length > 0, "length > 0")

        const id = IDFactory.createBetweenPosition(id1, id2, this.replicaNumber, this.clock++)
        const idi = new IdentifierInterval(id, length - 1)
        const newBlock = new LogootSBlock(idi, 0)
        this.mapBaseToBlock[idi.base.join(",")] = newBlock
        return RopesNodes.leaf(newBlock, 0, length)
    }

    insertLocal (pos: number, l: string): LogootSAdd {
        console.assert(isInt32(pos), "pos ∈ int32")

        if (this.root === null) { // empty tree
            this.root = this.mkNode(null, null, l.length)
            this.str = TextUtils.insert(this.str, pos, l)
            return new LogootSAdd(this.root.getIdBegin(), l)
        } else {
            let newNode
            const length = this.str.length
            this.str = TextUtils.insert(this.str, pos, l)
            let path: RopesNodes[]
            if (pos === 0) { // begin of string
                path = []
                path.push(this.root)
                const n = this.getXest(leftChildOf, path)
                if (n.isAppendableBefore(this.replicaNumber, l.length)) {
                    const id = n.appendBegin(l.length)
                    this.ascendentUpdate(path, l.length)
                    return new LogootSAdd(id, l)
                } else {// add node
                    newNode = this.mkNode(null, n.getIdBegin(), l.length)
                    n.left = newNode
                }
            } else if (pos >= length) { // end
                path = []
                path.push(this.root)
                const n = this.getXest(rightChildOf, path)
                if (n.isAppendableAfter(this.replicaNumber, l.length)) { // append
                    const id3 = n.appendEnd(l.length)
                    this.ascendentUpdate(path, l.length)
                    return new LogootSAdd(id3, l)
                } else {// add at end
                    newNode = this.mkNode(n.getIdEnd(), null, l.length)
                    n.right = newNode
                }
            } else { // middle
                const inPos = this.searchNode(pos) as ResponseIntNode
                // TODO: why non-null?
                if (inPos.i > 0) { // split
                    const id1 = inPos.node.block.idInterval.getBaseId(inPos.node.actualBegin + inPos.i - 1)
                    const id2 = inPos.node.block.idInterval.getBaseId(inPos.node.actualBegin + inPos.i)
                    newNode = this.mkNode(id1, id2, l.length)
                    path = inPos.path
                    path.push(inPos.node.split(inPos.i, newNode))
                } else {
                    const prev = this.searchNode(pos - 1) as ResponseIntNode
                    // TODO: why non-null?
                    if (inPos.node.isAppendableBefore(this.replicaNumber, l.length)) {
                        // append before

                        const id5 = inPos.node.appendBegin(l.length)
                        this.ascendentUpdate(inPos.path, l.length)

                        return new LogootSAdd(id5, l)
                    } else if (prev.node.isAppendableAfter(this.replicaNumber, l.length)) {
                        // append after

                        const id4 = prev.node.appendEnd(l.length)
                        this.ascendentUpdate(prev.path, l.length)

                        return new LogootSAdd(id4, l)
                    } else {
                        newNode = this.mkNode(prev.node.getIdEnd(),
                            inPos.node.getIdBegin(), l.length)
                        newNode.right = prev.node.right
                        prev.node.right = newNode
                        path = prev.path
                        path.push(newNode)
                    }
                }
            }
            this.balance(path)

            return new LogootSAdd(newNode.getIdBegin(), l)
        }
    }

    getXest (
        aChildOf: (a: RopesNodes) => RopesNodes | null,
        aPath: RopesNodes[]): RopesNodes {

        let n = aPath[aPath.length - 1]
        let child = aChildOf(n)
        while (child !== null) {
            n = child
            aPath[aPath.length] = child
            child = aChildOf(child)
        }
        return n
    }

    searchPos (id: Identifier, path: RopesNodes[]): number {
        let i = 0
        let node = this.root
        while (node !== null) {
            path.push(node)
            if (id.compareTo(node.getIdBegin()) === -1) {
                node = node.left
            } else if (id.compareTo(node.getIdEnd()) === 1) {
                i = i + node.leftSubtreeSize() + node.length
                node = node.right
            } else {
                if (id.equalsBase(node.getIdBegin())) {
                    return i + node.leftSubtreeSize()
                } else {
                    // Could not find the identifier, stop the search
                    node = null
                }
            }
        }
        // FIXME: Clear path?
        return -1
    }

    searchNode (pos: number): ResponseIntNode | null {
        console.assert(isInt32(pos), "pos ∈ int32")

        let node = this.root
        const path: RopesNodes[] = []
        while (node !== null) {
            path.push(node)

            const before = node.leftSubtreeSize()
            if (pos < before) {
                node = node.left
            } else if (pos < before + node.length) {
                return {
                    i: pos - before,
                    node,
                    path,
                }
            } else {
                pos -= before + node.length
                node = node.right
            }
        }
        return null
    }

    ascendentUpdate (path: RopesNodes[], length: number): void {
        console.assert(isInt32(length), "length ∈ int32")
        // `length" may be negative

        for (const item of path) {
            item.addString(length)
        }
    }

    delBlock (idInterval: IdentifierInterval, author: number): TextDelete[] {
        const l: TextDelete[] = []
        let i
        while (true) {
            const path: RopesNodes[] = []
            i = this.searchPos(idInterval.idBegin, path)
            if (i === -1) {
                // Could not find the first identifier from the interval
                if (idInterval.begin < idInterval.end) {
                    // Shifting the interval and resuming the search
                    const newIdBegin =
                        Identifier.fromBase(idInterval.idBegin, idInterval.begin + 1)
                    idInterval =
                        new IdentifierInterval(newIdBegin, idInterval.end)
                } else {
                    break
                }
            } else {
                // Was able to find the position of the identifier
                const node = path[path.length - 1] as RopesNodes // Retrieving the node containing the identifier
                const end = Math.min(idInterval.end, node.actualEnd)
                const pos = i + idInterval.begin - node.actualBegin
                const length = end - idInterval.begin + 1
                l.push(new TextDelete(pos, length, author))
                const t = node.deleteOffsets(idInterval.begin, end)

                if (node.length === 0) { // del node
                    this.delNode(path)
                } else if (t !== null) {
                    path.push(t)
                    this.balance(path)
                } else {
                    // TODO: Check second argument
                    this.ascendentUpdate(path, idInterval.begin - end - 1)
                }

                if (end === idInterval.end) {
                    break
                } else {
                    // TODO: Check if still valid
                    const newIdBegin =
                        Identifier.fromBase(idInterval.idBegin, end)
                    idInterval = new IdentifierInterval(newIdBegin, idInterval.end)
                }
            }
        }

        l.forEach((textDelete: TextDelete) => {
            this.applyTextDelete(textDelete)
        })

        return l
    }

    delLocal (begin: number, end: number): LogootSDel {
        console.assert(isInt32(begin), "begin ∈ int32")
        console.assert(isInt32(end), "end ∈ int32")
        console.assert(begin <= end, "" + begin, " <= " + end)

        this.str = TextUtils.del(this.str, begin, end)
        let length = end - begin + 1
        const li: IdentifierInterval[] = []
        do {
            const start = this.searchNode(begin)
            if (start !== null) {
                const newBegin = start.node.actualBegin + start.i
                const newEnd = Math.min(newBegin + length - 1, start.node.actualEnd)
                const prevIdBegin = start.node.getIdBegin()
                const newIdBegin =
                    Identifier.fromBase(prevIdBegin, newBegin)
                li.push(new IdentifierInterval(newIdBegin, newEnd))
                const r = start.node.deleteOffsets(newBegin, newEnd)
                length -= newEnd - newBegin + 1

                if (start.node.length === 0) {
                    this.delNode(start.path)
                } else if (r !== null) {// node has been splited
                    start.path.push(r)
                    this.balance(start.path)
                } else {
                    this.ascendentUpdate(start.path, newBegin - newEnd - 1)
                }
            } else {
                length = 0
            }
        } while (length > 0)

        return new LogootSDel(li, this.replicaNumber)
    }

    delNode (path: RopesNodes[]): void {
        const node = path[path.length - 1]
        if (node.block.nbElement === 0) {
            delete this.mapBaseToBlock[node.block.idInterval.base.join(",")]
        }

        if (node.right === null) {
            if (node === this.root) {
                this.root = node.left
            } else {
                path.pop()
                path[path.length - 1].replaceChildren(node, node.left)
            }
        } else if (node.left === null) {
            if (node === this.root) {
                this.root = node.right
            } else {
                path.pop()
                path[path.length - 1].replaceChildren(node, node.right)
            }
        } else { // two children
            path.push(node.right)
            const min = this.getMinPath(path)
            node.become(min)
            path.pop()
            path[path.length - 1].replaceChildren(min, min.right)
        }
        this.balance(path)
    }

    getMinPath (path: RopesNodes[]): RopesNodes {
        console.assert(path.length !== 0, "path has at least one item")

        let node = path[path.length - 1] as RopesNodes // precondition
        while (node.left !== null) {
            node = node.left
            path.push(node)
        }
        return node
    }

    // TODO: Implémenter la balance de Google (voir AVL.js) et vérifier ses performances en comparaison
    balance (path: RopesNodes[]): void {
        while (path.length > 0) {
            const node = path.pop() as RopesNodes // Loop condition

            let father = path.length === 0 ? null : path[path.length - 1]
            node.sumDirectChildren()

            let balance = node.balanceScore()
            while (Math.abs(balance) >= 2) {
                if (balance >= 2) {
                    if (node.right !== null && node.right.balanceScore() <= -1) {
                        father = this.rotateRL(node, father) // Double left
                    } else {
                        father = this.rotateLeft(node, father)
                    }
                } else {
                    if (node.left !== null && node.left.balanceScore() >= 1) {
                        father = this.rotateLR(node, father) // Double right
                    } else {
                        father = this.rotateRight(node, father)
                    }
                }

                path.push(father)
                balance = node.balanceScore()
            }
        }
    }

    rotateLeft (node: RopesNodes, father: RopesNodes | null): RopesNodes {
        console.assert(node.right !== null, "There exists a right node")
        console.assert((node === this.root) === (father === null),
            "The father is null when we are rotating left the root")

        const r = node.right as RopesNodes // precondition
        if (node === this.root) {
            this.root = r
        } else {
            // FIXME: Should we not replace the left child in this case?
            (father as RopesNodes).replaceChildren(node, r)
            // FIXME: This assert fails from time to time, verify its correctness
            // console.assert((father as RopesNodes).left !== null, "There exists a left node")
        }
        node.right = r.left
        r.left = node
        node.sumDirectChildren()
        r.sumDirectChildren()
        return r
    }

    rotateRight (node: RopesNodes, father: RopesNodes | null): RopesNodes {
        console.assert(node.left !== null, "There exists a left node")
        console.assert((node === this.root) === (father === null),
            "The father is null when we are rotating right the root")

        const r = node.left as RopesNodes // precondition
        if (node === this.root) {
            this.root = r
        } else {
            // FIXME: Should we not replace the right child in this case?
            (father as RopesNodes).replaceChildren(node, r)
            // FIXME: This assert fails from time to time, verify its correctness
            // console.assert((father as RopesNodes).right !== null, "There exists a right node")
        }
        node.left = r.right
        r.right = node
        node.sumDirectChildren()
        r.sumDirectChildren()
        return r
    }

    rotateRL (node: RopesNodes, father: RopesNodes | null): RopesNodes {
        console.assert(node.right !== null, "There exists a right node")
        const rightNode = node.right as RopesNodes // precondition
        console.assert(rightNode.left !== null,
            "There exists a left node of the right node")

        this.rotateRight(rightNode, node)
        return this.rotateLeft(node, father)
    }

    rotateLR (node: RopesNodes, father: RopesNodes | null): RopesNodes {
        console.assert(node.left !== null, "There exists a left node")
        const leftNode = node.left as RopesNodes // precondition
        console.assert(leftNode.right !== null,
            "There exists a right node of the left node")

        this.rotateLeft(leftNode, node)
        return this.rotateRight(node, father)
    }

    getNext (path: RopesNodes[]): boolean {
        const node = path[path.length - 1]
        if (node.right === null) {
            if (path.length > 1) {
                const father = path[path.length - 2]
                if (father.left === node) {
                    path.pop()
                    return true
                }
            }
            return false
        } else {
            path.push(node.right)
            this.getXest(leftChildOf, path)
            return true
        }
    }

    /**
     * @return tree digest
     */
    digest (): number {
        let result = 0
        const root = this.root
        if (root !== null) {
            const linearRpr = root.toList()
            for (const idi of linearRpr) {
                result = (result * 17 + idi.digest()) | 0
                // Convert to 32bits integer
            }
        }
        return result
    }

}
