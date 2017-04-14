/*
 *  Copyright 2014 Matthieu Nicolas
 *
 *  This file is part of Mute-structs.
 *
 *  Mute-structs is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  Mute-structs is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with Mute-structs.  If not, see <http://www.gnu.org/licenses/>.
 */

import {Identifier} from './identifier'
import {IdentifierInterval} from './identifierinterval'
import * as IDFactory from './idfactory'
import {
    IteratorHelperIdentifier,
    IdentifierIteratorResults
} from './iteratorhelperidentifier'
import {LogootSAdd} from './logootsadd'
import {LogootSBlock} from './logootsblock'
import {LogootSDel} from './logootsdel'
import {ResponseIntNode} from './responseintnode'
import {RopesNodes} from './ropesnodes'
import {TextDelete} from './textdelete'
import {TextInsert} from './textinsert'
import * as TextUtils from './textutils'


function leftChildOf (aNode: RopesNodes): RopesNodes | null {
    console.assert(aNode instanceof RopesNodes, "aNode = ", aNode)

    return aNode.left
}

function rightChildOf (aNode: RopesNodes): RopesNodes | null {
    console.assert(aNode instanceof RopesNodes, "aNode = ", aNode)

    return aNode.right
}

export class LogootSRopes {

    constructor (replica = 0, clock = 0, root: RopesNodes | null = null, str = "") {

        console.assert(typeof replica === "number",
            "replicaNumber = " + replica)

        this.replicaNumber = replica
        this.clock = clock
        this.root = root
        this.str = str

        const baseToBlock: {[key: string]: LogootSBlock} = {}
        if (root !== null) {
            const blocks = root.getBlocks()

            for (const b of blocks) {
                const key = b.id.base.join(",")
                baseToBlock[key] = b
            }
        }
        this.mapBaseToBlock = baseToBlock
    }

    static empty (): LogootSRopes {
        return new LogootSRopes(0, 0)
    }

    static fromPlain (replica: number, clock: number, o: {root?: any, str?: any}): LogootSRopes | null {
        const plainRoot = o.root
        const str = o.str

        if (typeof str === "string") {
            const root = (plainRoot !== undefined && plainRoot !== null) ?
                RopesNodes.fromPlain(plainRoot) :
                null
            const result = new LogootSRopes(replica, clock, root, str)

            if (str.length !== 0 && root === null) {
                // FIXME: Need more checking (str's length compared to tree length?)
                return null
            } else {
                return result
            }
        } else {
            return null
        }
    }

    readonly replicaNumber: number

    clock: number

    root: RopesNodes | null

    readonly mapBaseToBlock: {[key: string]: LogootSBlock}

    str: string

    getBlock (id: IdentifierInterval): LogootSBlock {
        console.assert(id instanceof IdentifierInterval, "id = ", id)

        const mapBaseToBlock = this.mapBaseToBlock
        const key = id.base.join(",")
        let result

        if (mapBaseToBlock.hasOwnProperty(key)) {
            result = mapBaseToBlock[key]
        } else {
            result = new LogootSBlock(id, 0)
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
     **/
    addBlockFrom (str: string, idi: IdentifierInterval,
            from: RopesNodes, startOffset: number): TextInsert[] {
        const result: TextInsert[] = this.addBlockFromRec(str, idi, from, startOffset)
        result.forEach((textInsert: TextInsert) => {
          this.applyTextInsert(textInsert)
        })
        return result
    }

    addBlockFromRec (str: string, idi: IdentifierInterval,
            from: RopesNodes, startOffset: number): TextInsert[] {
        const path: RopesNodes[] = []
        const result: TextInsert[] = []
        let con = true
        let i = startOffset
        while (con) {
            path.push(from)
            const ihi = new IteratorHelperIdentifier(idi,
                    from.getIdentifierInterval())
            let split

            // B1 is the block we are adding
            // B2 is the block to which we are comparing
            switch (ihi.compareBase()) {
                case IdentifierIteratorResults.B1_AFTER_B2: {
                    if (from.right === null) {
                        from.right = RopesNodes.leaf(this.getBlock(idi),
                            idi.begin, str.length)
                        i = i + from.leftSubtreeSize() + from.length
                        result.push(new TextInsert(i, str))
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
                        result.push(new TextInsert(i, str))
                        con = false
                    } else {
                        from = from.left
                    }
                    break
                }
                case IdentifierIteratorResults.B1_INSIDE_B2: {
                    // split b2 the object node
                    split = Math.min(from.maxOffset(), ihi.nextOffset)
                    const rp = RopesNodes.leaf(this.getBlock(idi),
                        idi.begin, str.length)
                    path.push(from.split(split - from.offset + 1, rp))
                    i = i + from.leftSubtreeSize()
                    result.push(new TextInsert(i + split - from.offset + 1, str))
                    con = false
                    break
                }
                case IdentifierIteratorResults.B2_INSIDE_B1: {
                    // split b1 the node to insert
                    const split2 = /* Math.min(idi.getEnd(), */ihi.nextOffset/* ) */
                    let ls = str.substr(0, split2 + 1 - idi.begin)
                    let idi1 = new IdentifierInterval(idi.base,
                            idi.begin, split2)
                    if (from.left === null) {
                        from.left = RopesNodes.leaf(this.getBlock(idi1),
                            idi1.begin, ls.length)
                        result.push(new TextInsert(i, ls))
                    } else {
                        Array.prototype.push.apply(result,
                            this.addBlockFromRec(ls, idi1, from.left, i))
                    }

                    // i=i+ls.size()

                    ls = str.substr(split2 + 1 - idi.begin, str.length)
                    idi1 = new IdentifierInterval(idi.base, split2 + 1, idi.end)
                    i = i + from.leftSubtreeSize() + from.length
                    if (from.right === null) {
                        from.right = RopesNodes.leaf(this.getBlock(idi1),
                            idi1.begin, ls.length)
                        result.push(new TextInsert(i, ls))
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
                        split = from.getIdBegin().minOffsetAfterPrev(
                                from.left.getIdEnd(), idi.begin)
                        const l = str.substr(split - idi.begin, str.length)
                        from.appendBegin(l.length)
                        result.push(new TextInsert(i + from.leftSubtreeSize(), l))

                        this.ascendentUpdate(path, l.length)

                        // check if previous is smaller or not
                        if ((split - 1) >= idi.begin) {
                            str = str.substr(0, split - idi.begin)
                            idi = new IdentifierInterval(idi.base, idi.begin, split - 1)
                            from = from.left
                        } else {
                            con = false
                        }
                    } else {
                        result.push(new TextInsert(i, str))
                        from.appendBegin(str.length)
                        this.ascendentUpdate(path, str.length)
                        con = false
                    }

                    break
                }
                case IdentifierIteratorResults.B2_CONCAT_B1: {
                    // concat at end
                    if (from.right !== null) {
                        split = from.getIdEnd().maxOffsetBeforeNext(
                                from.right.getIdBegin(), idi.end)
                        const l = str.substr(0, split + 1 - idi.begin)
                        i = i + from.leftSubtreeSize() + from.length
                        from.appendEnd(l.length)
                        result.push(new TextInsert(i, l))

                        this.ascendentUpdate(path, l.length)

                        if (idi.end >= (split + 1)) {
                            str = str.substr(split + 1 - idi.begin, str.length)
                            idi = new IdentifierInterval(idi.base, split + 1, idi.end)
                            from = from.right
                            i = i + l.length
                        } else {
                            con = false
                        }
                    } else {
                        i = i + from.leftSubtreeSize() + from.length
                        result.push(new TextInsert(i, str))
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
      this.str = TextUtils.insert(this.str, textInsert.offset, textInsert.content)
    }

    // FIXME: Put this function elsewhere?
    applyTextDelete (textDelete: TextDelete): void {
      const end: number = textDelete.offset + textDelete.length - 1
      this.str = TextUtils.del(this.str, textDelete.offset, end)
    }

    addBlock (str: string, id: Identifier): TextInsert[] {
        console.assert(typeof str === "string", "str = " + str)
        console.assert(id instanceof Identifier, "id = ", id)

        const idi = new IdentifierInterval(id.base, id.last,
                id.last + str.length - 1)

        if (this.root === null) {
            const bl = new LogootSBlock(idi, 0)
            this.mapBaseToBlock[bl.id.base.join(",")] = bl
            this.root = RopesNodes.leaf(bl, id.last, str.length)
            const textInsert: TextInsert = new TextInsert(0, str)
            this.applyTextInsert(textInsert)
            return [textInsert]
        } else {
            return this.addBlockFrom(str, idi, this.root, 0)
        }
    }

    mkNode (id1: Identifier | null, id2: Identifier | null, length: number): RopesNodes {
        console.assert(id1 === null || id1 instanceof Identifier, "id1 = ", id1)
        console.assert(id2 === null || id2 instanceof Identifier, "id2 = ", id2)
        console.assert(typeof length === "number", "length = " + length)
        console.assert(length > 0, "" + length, " > 0")

        const base = IDFactory.createBetweenPosition(id1, id2, this.replicaNumber, this.clock++)
        const idi = new IdentifierInterval(base, 0, length - 1)
        const newBlock = LogootSBlock.mine(idi, 0)
        this.mapBaseToBlock[idi.base.join(",")] = newBlock
        return RopesNodes.leaf(newBlock, 0, length)
    }

    insertLocal (pos: number, l: string): LogootSAdd {
        console.assert(typeof pos === "number", "pos = ", pos)
        console.assert(typeof l === "string", "l = ", l)
        let n

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
                n = this.getXest(leftChildOf, path)
                if (n.isAppendableBefore()) {
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
                n = this.getXest(rightChildOf, path)
                if (n.isAppendableAfter()) {// append
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
                    const id1 = inPos.node.block.id.getBaseId(inPos.node.offset + inPos.i - 1)
                    const id2 = inPos.node.block.id.getBaseId(inPos.node.offset + inPos.i)
                    newNode = this.mkNode(id1, id2, l.length)
                    path = inPos.path
                    path.push(inPos.node.split(inPos.i, newNode))
                } else {
                    const prev = this.searchNode(pos - 1) as ResponseIntNode
                        // TODO: why non-null?
                    if (inPos.node.isAppendableBefore() &&
                            inPos.node.getIdBegin().hasPlaceBefore(
                                prev.node.getIdEnd(), l.length)) {
                        // append before

                        const id5 = inPos.node.appendBegin(l.length)
                        this.ascendentUpdate(inPos.path, l.length)

                        return new LogootSAdd(id5, l)
                    } else if (prev.node.isAppendableAfter() &&
                            prev.node.getIdEnd().hasPlaceAfter(
                                inPos.node.getIdBegin(), l.length)) {
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

    getXest (aChildOf: (a: RopesNodes) => RopesNodes | null,
            aPath: RopesNodes[]): RopesNodes {
        console.assert(aChildOf instanceof Function, "aChildOf = ", aChildOf)
        console.assert(aPath instanceof Array, "aPath = ", aPath)

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
        console.assert(id instanceof Identifier, "id = ", id)
        console.assert(path instanceof Array, "path = ", path)

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
        console.assert(typeof pos === "number", "pos = ", pos)

        let node1 = this.root
        let path1: RopesNodes[] = []
        while (node1 !== null) {
            path1.push(node1)

            const before = node1.leftSubtreeSize()
            if (pos < before) {
                node1 = node1.left
            } else if (pos < before + node1.length) {
                return {
                    i: pos - before,
                    node: node1,
                    path: path1
                }
            } else {
                pos -= before + node1.length
                node1 = node1.right
            }
        }
        return null
    }

    ascendentUpdate (path: RopesNodes[], length: number): void {
        console.assert(path instanceof Array, "path = ", path)
        console.assert(typeof length === "number", "length = ", length)
        // `length' may be negative

        for (const item of path) {
            item.addString(length)
        }
    }

    delBlock (id: IdentifierInterval): TextDelete[] {
        console.assert(id instanceof IdentifierInterval, "id = ", id)

        let l: TextDelete[] = []
        let i
        while (true) {
            const path: RopesNodes[] = []
            i = this.searchPos(id.getBeginId(), path)
            if (i === -1) {
                // Could not find the first identifier from the interval
                if (id.begin < id.end) {
                    // Shifting the interval and resuming the search
                    id = new IdentifierInterval(id.base, id.begin + 1,
                            id.end)
                } else {
                    break
                }
            } else {
                // Was able to find the position of the identifier
                const node = path[path.length - 1] as RopesNodes // Retrieving the node containing the identifier
                const end = Math.min(id.end, node.maxOffset())
                const pos = i + id.begin - node.offset
                const length = end - id.begin + 1
                l.push(new TextDelete(pos, length))
                const t = node.deleteOffsets(id.begin, end)

                if (node.length === 0) { // del node
                    this.delNode(path)
                } else if (t !== null) {
                    path.push(t)
                    this.balance(path)
                } else {
                    // TODO: Check second argument
                    this.ascendentUpdate(path, id.begin - end - 1)
                }

                if (end === id.end) {
                    break
                } else {
                    // TODO: Check if still valid
                    id = new IdentifierInterval(id.base, end, id.end)
                }
            }
        }

        l.forEach((textDelete: TextDelete) => {
          this.applyTextDelete(textDelete)
        })

        return l
    }

    delLocal (begin: number, end: number): LogootSDel {
        console.assert(typeof begin === "number", "begin = " + begin)
        console.assert(typeof end === "number", "end = " + end)
        console.assert(begin <= end, "" + begin, " <= " + end)

        this.str = TextUtils.del(this.str, begin, end)
        let length = end - begin + 1
        let li: IdentifierInterval[] = []
        do {
            const start = this.searchNode(begin)
            if (start !== null) {
                const be = start.node.offset + start.i
                const en = Math.min(be + length - 1, start.node.maxOffset())
                li.push(new IdentifierInterval(start.node.block.id.base, be, en))
                const r = start.node.deleteOffsets(be, en)
                length -= en - be + 1

                if (start.node.length === 0) {
                    this.delNode(start.path)
                } else if (r !== null) {// node has been splited
                    start.path.push(r)
                    this.balance(start.path)
                } else {
                    this.ascendentUpdate(start.path, be - en - 1)
                }
            } else {
                length = 0
            }
        } while (length > 0)

        return new LogootSDel(li)
    }

    delNode (path: RopesNodes[]): void {
        console.assert(path instanceof Array, "path = ", path)

        const node = path[path.length - 1]
        if (node.block.nbElement === 0) {
            delete this.mapBaseToBlock[node.block.id.base.join(",")]
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
        console.assert(path instanceof Array, "path = ", path)
        console.assert(path.length !== 0, "`path' has at least one item")

        let node = path[path.length - 1] as RopesNodes // precondition
        while (node.left !== null) {
            node = node.left
            path.push(node)
        }
        return node
    }

    // TODO: Implémenter la balance de Google (voir AVL.js) et vérifier ses performances en comparaison
    balance (path: RopesNodes[]): void {
        console.assert(path instanceof Array, "path = ", path)

        while (path.length > 0) {
            let node = path.pop() as RopesNodes // Loop condition

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
        console.assert(node instanceof RopesNodes, "node = ", node)
        console.assert(father === null || father instanceof RopesNodes,
            "father = ", father)
        console.assert(node.right !== null, "There exists a right node")
        console.assert((node === this.root) === (father === null), "The father is null when we are rotating left the root")

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
        console.assert(node instanceof RopesNodes, "node = ", node)
        console.assert(father === null || father instanceof RopesNodes,
            "father = ", father)
        console.assert(node.left !== null, "There exists a left node")
        console.assert((node === this.root) === (father === null), "The father is null when we are rotating right the root")

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
        console.assert(node instanceof RopesNodes, "node = ", node)
        console.assert(father === null || father instanceof RopesNodes,
            "father = ", father)
        console.assert(node.right !== null, "There exists a right node")
        const rightNode = node.right as RopesNodes // precondition
        console.assert(rightNode.left !== null,
            "There exists a left node of the right node")

        this.rotateRight(rightNode, node)
        return this.rotateLeft(node, father)
    }

    rotateLR (node: RopesNodes, father: RopesNodes | null): RopesNodes {
        console.assert(node instanceof RopesNodes, "node = ", node)
        console.assert(father === null || father instanceof RopesNodes,
            "father = ", father)
        console.assert(node.left !== null, "There exists a left node")
        const leftNode = node.left as RopesNodes // precondition
        console.assert(leftNode.right !== null,
            "There exists a right node of the left node")

        this.rotateLeft(leftNode, node)
        return this.rotateRight(node, father)
    }

    getNext (path: RopesNodes[]): boolean {
        console.assert(path instanceof Array, "path = ", path)

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
        }  else {
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
            for (let idi of linearRpr) {
                result = (result * 17 + idi.digest()) | 0
                    // Convert to 32bits integer
            }
        }
        return result
    }

}
