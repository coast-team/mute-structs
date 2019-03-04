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
import {Identifier} from "./identifier"
import {IdentifierInterval} from "./identifierinterval"
import {isInt32} from "./int32"
import {LogootSBlock} from "./logootsblock"

/**
 * @param aNode may be null
 * @returns Height of aNode or 0 if aNode is null
 */
function heightOf (aNode: RopesNodes | null): number {
    if (aNode !== null) {
        return aNode.height
    } else {
        return 0
    }
}

/**
 * @param aNode may be null
 * @returns size of aNode (including children sizes) or 0 if aNode is null
 */
function subtreeSizeOf (aNode: RopesNodes | null): number {
    if (aNode !== null) {
        return aNode.sizeNodeAndChildren
    } else {
        return 0
    }
}

export class RopesNodes {

    static fromPlain (o: unknown): RopesNodes | null {
        if (isObject<RopesNodes>(o) &&
            isInt32(o.actualBegin) && isInt32(o.length) && o.length >= 0) {

            const block = LogootSBlock.fromPlain(o.block)
            if (block !== null &&
                block.idInterval.begin <= o.actualBegin &&
                (block.idInterval.end - block.idInterval.begin) >= o.length - 1) {

                const right = RopesNodes.fromPlain(o.right)
                const left = RopesNodes.fromPlain(o.left)
                return new RopesNodes(block, o.actualBegin, o.length, left, right)
            }
        }
        return null
    }

    static leaf (block: LogootSBlock, offset: number, lenth: number): RopesNodes {
        console.assert(isInt32(offset), "aOffset ∈ int32")
        console.assert(isInt32(lenth), "lenth ∈ int32")
        console.assert(lenth > 0, "lenth > 0")

        block.addBlock(offset, lenth) // Mutation
        return new RopesNodes(block, offset, lenth, null, null)
    }

// Access
    left: RopesNodes | null

    right: RopesNodes | null

    height: number

    block: LogootSBlock

    /**
     * The current position of the beginning of the block
     *
     * Should always ensure that block.idInterval.begin <= actualBegin <= block.idInterval.end
     */
    actualBegin: number

    /**
     * The current length of the block
     *
     * Should always ensure that length <= to block.idInterval.end - block.idInterval.begin + 1
     */
    length: number

    sizeNodeAndChildren: number

// Creation
    constructor (
        block: LogootSBlock, actualBegin: number, length: number,
        left: RopesNodes | null, right: RopesNodes | null) {

        console.assert(isInt32(actualBegin), "actualBegin ∈ int32")
        console.assert(block.idInterval.begin <= actualBegin,
            "actualBegin must be greater than or equal to idInterval.begin")

        this.block = block
        this.actualBegin = actualBegin
        this.length = length
        this.left = left
        this.right = right
        this.height = Math.max(heightOf(left), heightOf(right)) + 1
        this.sizeNodeAndChildren = length +
            subtreeSizeOf(left) + subtreeSizeOf(right)
    }

    get actualEnd (): number {
        return this.actualBegin + this.length - 1
    }

    getIdBegin (): Identifier {
        return this.block.idInterval.getBaseId(this.actualBegin)
    }

    getIdEnd (): Identifier {
        return this.block.idInterval.getBaseId(this.actualEnd)
    }

    get max (): Identifier {
        if (this.right !== null) {
            return this.right.max
        }
        return this.getIdEnd()
    }

    get min (): Identifier {
        if (this.left !== null) {
            return this.left.min
        }
        return this.getIdBegin()
    }

    addString (length: number): void {
        console.assert(isInt32(length), "length  ∈ int32")
        // `length" may be negative

        this.sizeNodeAndChildren += length
    }

    appendEnd (length: number): Identifier {
        console.assert(isInt32(length), "length  ∈ int32")
        console.assert(length > 0, "" + length, " > 0")

        const b = this.actualEnd + 1
        this.length += length
        this.block.addBlock(b, length)
        return this.block.idInterval.getBaseId(b)
    }

    appendBegin (length: number): Identifier {
        console.assert(isInt32(length), "length  ∈ int32")
        console.assert(length > 0, "" + length, " > 0")

        this.actualBegin -= length
        this.length += length
        this.block.addBlock(this.actualBegin, length)
        return this.getIdBegin()
    }

    /**
     * Delete a interval of identifiers belonging to this node
     * Reduces the node"s {@link RopesNodes#length} and/or shifts its {@link RopesNodes#offset}
     * May also trigger a split of the current node if the deletion cuts it in two parts
     *
     * @param {number} begin The start of the interval to delete
     * @param {number} end The end of the interval to delete
     * @returns {RopesNodes | null} The resulting block if a split occured, null otherwise
     */
    deleteOffsets (begin: number, end: number): RopesNodes | null {
        console.assert(isInt32(begin), "begin  ∈ int32")
        console.assert(isInt32(end), "end  ∈ int32")
        console.assert(begin <= end, "begin <= end: " + begin, " <= " + end)
        console.assert(this.block.idInterval.begin <= begin,
            "this.block.idInterval.begin <= to begin: " + this.block.idInterval.begin, " <= " + begin)
        console.assert(end <= this.block.idInterval.end,
            "end <= this.block.idInterval.end: " + end, " <= " + this.block.idInterval.end)

        let ret: RopesNodes | null = null

        // Some identifiers may have already been deleted by a previous operation
        // Need to update the range of the deletion accordingly
        // NOTE: actualEnd can be < to actualBegin if all the range has previously been deleted
        const actualBegin: number = Math.max(this.actualBegin, begin)
        const actualEnd: number = Math.min(this.actualEnd, end)

        if (actualBegin <= actualEnd) {
            const sizeToDelete = actualEnd - actualBegin + 1
            this.block.delBlock(sizeToDelete)

            if (sizeToDelete !== this.length) {
                if (actualBegin === this.actualBegin) {
                    // Deleting the beginning of the block
                    this.actualBegin = actualEnd + 1
                } else if (actualEnd !== this.actualEnd) {
                    // Deleting the middle of the block
                    ret = this.split(actualEnd - this.actualBegin + 1, null)
                }
            }
            this.length = this.length - sizeToDelete
        }

        return ret
    }

    split (size: number, node: RopesNodes | null): RopesNodes {
        const newRight = new RopesNodes(this.block,
            this.actualBegin + size, this.length - size, node, this.right)
        this.length = size
        this.right = newRight
        this.height = Math.max(this.height, newRight.height)
        return newRight
    }

    leftSubtreeSize (): number {
        return subtreeSizeOf (this.left)
    }

    rightSubtreeSize (): number {
        return subtreeSizeOf (this.right)
    }

    sumDirectChildren (): void {
        this.height = Math.max(heightOf(this.left), heightOf(this.right)) + 1
        this.sizeNodeAndChildren = this.leftSubtreeSize() + this.rightSubtreeSize() + this.length
    }

    replaceChildren (node: RopesNodes, by: RopesNodes | null): void {
        if (this.left === node) {
            this.left = by
        } else if (this.right === node) {
            this.right = by
        }
    }

    balanceScore (): number {
        return heightOf(this.right) - heightOf(this.left)
    }

    become (node: RopesNodes): void {
        this.sizeNodeAndChildren = -this.length + node.length
        this.length = node.length
        this.actualBegin = node.actualBegin
        this.block = node.block
    }

    isAppendableAfter (replicaNumber: number, length: number): boolean {
        return this.block.isMine(replicaNumber) &&
            this.block.idInterval.end === this.actualEnd &&
            this.block.idInterval.idEnd.hasPlaceAfter(length)
    }

    isAppendableBefore (replicaNumber: number, length: number): boolean {
        return this.block.isMine(replicaNumber) &&
            this.block.idInterval.begin === this.actualBegin &&
            this.block.idInterval.idBegin.hasPlaceBefore(length)
    }

    toString (): string {
        const current = this.getIdentifierInterval().toString()
        const leftToString = (this.left !== null) ? this.left.toString() : "\t#"
        const rightToString = (this.right !== null) ? this.right.toString() : "\t#"
        return rightToString.replace(/(\t+)/g, "\t$1") + "\n" +
                "\t" + current + "\n" +
                leftToString.replace(/(\t+)/g, "\t$1")
    }

    /**
     * @return linear representation
     */
    toList (): IdentifierInterval[] {
        const idInterval = this.getIdentifierInterval()
        const leftList =  (this.left !== null) ? this.left.toList() : []
        const rightList = (this.right !== null) ? this.right.toList() : []
        return leftList.concat(idInterval, rightList)
    }

    getIdentifierInterval (): IdentifierInterval {
        return new IdentifierInterval(this.getIdBegin(), this.actualEnd)
    }

    /**
     * @return list of blocks (potentially with occurrences)
     */
    getBlocks (): LogootSBlock[] {
        let result = [this.block]

        const left = this.left
        if (left !== null) {
            result = result.concat(left.getBlocks())
        }

        const right = this.right
        if (right !== null) {
            result = result.concat(right.getBlocks())
        }

        return result
    }

}
