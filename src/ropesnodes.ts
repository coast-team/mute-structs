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
import {LogootSBlock} from './logootsblock'


/**
* @param aNode may be null
* @returns Height of aNode or 0 if aNode is null
*/
function heightOf (aNode: RopesNodes | null): number {
    console.assert(aNode === null || aNode instanceof RopesNodes, "aNode = ", aNode)

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
    console.assert(aNode === null || aNode instanceof RopesNodes, "aNode = ", aNode)

    if (aNode !== null) {
        return aNode.sizeNodeAndChildren
    } else {
        return 0
    }
}

export class RopesNodes {

// Creation
    constructor (block: LogootSBlock, offset: number, length: number,
        left: RopesNodes | null, right: RopesNodes | null) {

        this.block = block
        this.offset = offset
        this.length = length
        this.left = left
        this.right = right
        this.height = Math.max(heightOf(left), heightOf(right)) + 1
        this.sizeNodeAndChildren = length +
            subtreeSizeOf(left) + subtreeSizeOf(right)
    }

    static fromPlain (o: SafeAny<RopesNodes>): RopesNodes | null {
        if (typeof o === "object" && o !== null) {
          const plainBlock: SafeAny<LogootSBlock> = o.block
          const offset: SafeAny<number> = o.offset
          const length: SafeAny<number> = o.length
          const plainLeft: SafeAny<RopesNodes> = o.left
          const plainRight: SafeAny<RopesNodes> = o.right

          if (plainBlock instanceof Object &&
              typeof offset === "number" && Number.isInteger(offset) &&
              typeof length === "number" && Number.isInteger(length) &&
              length >= 0) {

              const block: LogootSBlock | null = LogootSBlock.fromPlain(plainBlock)
              const right: RopesNodes | null = RopesNodes.fromPlain(plainRight)
              const left: RopesNodes | null = RopesNodes.fromPlain(plainLeft)

              if (block !== null &&
                  block.idInterval.begin <= offset &&
                  (block.idInterval.end - block.idInterval.begin) >= length - 1) {

                  return new RopesNodes(block, offset, length, left, right)
              }
          }
        }
        return null
    }

    static leaf (aBlock: LogootSBlock, aOffset: number, aLength: number): RopesNodes {
        console.assert(aBlock instanceof LogootSBlock, "aBlock = ", aBlock)
        console.assert(typeof aOffset === "number", "aOffset = " + aOffset)
        console.assert(typeof aLength === "number", "aLength = " + aLength)
        console.assert(aLength > 0, "" + aLength, " > 0")

        aBlock.addBlock(aOffset, aLength) // Mutation
        return new RopesNodes(aBlock, aOffset, aLength, null, null)
    }

// Access
    left: RopesNodes | null

    right: RopesNodes | null

    height: number

    block: LogootSBlock

    /**
     * The current position of the beginning of the block
     *
     * Should always ensure that block.idInterval.begin <= offset <= block.idInterval.end
     */
    offset: number

    /**
     * The current length of the block
     *
     * Should always ensure that length <= to block.idInterval.end - block.idInterval.begin + 1
     */
    length: number

    sizeNodeAndChildren: number

    getIdBegin (): Identifier {
        return this.block.idInterval.getBaseId(this.offset)
    }

    getIdEnd (): Identifier {
        return this.block.idInterval.getBaseId(this.maxOffset())
    }

    addString (length: number): void {
        console.assert(typeof length === "number", "length = " + length)
        // `length' may be negative

        this.sizeNodeAndChildren += length
    }

    appendEnd (length: number): Identifier {
        console.assert(typeof length === "number", "length = ", length)
        console.assert(length > 0, "" + length, " > 0")

        const b = this.maxOffset() + 1
        this.length += length
        this.block.addBlock(b, length)
        return this.block.idInterval.getBaseId(b)
    }

    appendBegin (length: number): Identifier {
        console.assert(typeof length === "number", "length = ", length)
        console.assert(length > 0, "" + length, " > 0")

        this.offset -= length
        this.length += length
        this.block.addBlock(this.offset, length)
        return this.getIdBegin()
    }

    /**
     * Delete a interval of identifiers belonging to this node
     * Reduces the node's {@link RopesNodes#length} and/or shifts its {@link RopesNodes#offset}
     * May also trigger a split of the current node if the deletion cuts it in two parts
     *
     * @param {number} begin The start of the interval to delete
     * @param {number} end The end of the interval to delete
     * @returns {RopesNodes | null} The resulting block if a split occured, null otherwise
     */
    deleteOffsets (begin: number, end: number): RopesNodes | null {
        console.assert(typeof begin === "number" && Number.isInteger(begin),
            "begin = " + begin)
        console.assert(typeof end === "number" && Number.isInteger(end),
            "end = " + end)
        console.assert(begin <= end, "begin <= end: " + begin, " <= " + end)
        console.assert(this.block.idInterval.begin <= begin, "this.block.idInterval.begin <= to begin: " + this.block.idInterval.begin, " <= " + begin)
        console.assert(end <= this.block.idInterval.end, "end <= this.block.idInterval.end: " + end, " <= " + this.block.idInterval.end)

        let ret: RopesNodes | null = null

        // Some identifiers may have already been deleted by a previous operation
        // Need to update the range of the deletion accordingly
        // NOTE: actualEnd can be < to actualBegin if all the range has previously been deleted
        const actualBegin: number = Math.max(this.offset, begin)
        const actualEnd: number = Math.min(this.maxOffset(), end)

        if (actualBegin <= actualEnd) {
          const sizeToDelete = actualEnd - actualBegin + 1
          this.block.delBlock(sizeToDelete)

          if (sizeToDelete !== this.length) {
            if (actualBegin === this.offset) {
              // Deleting the beginning of the block
              this.offset = actualEnd + 1
            } else if (actualEnd !== this.maxOffset()) {
              // Deleting the middle of the block
              ret = this.split(actualEnd - this.offset + 1, null)
            }
          }

          this.length = this.length - sizeToDelete
        }

        return ret
    }

    split (size: number, node: RopesNodes | null): RopesNodes {
        console.assert(typeof size === "number", "size = ", size)
        console.assert(node instanceof RopesNodes || node === null,
            "node = ", node)

        const newRight = new RopesNodes(this.block,
            this.offset + size, this.length - size, node, this.right)
        this.length = size
        this.right = newRight
        this.height = Math.max(this.height, newRight.height)
        return newRight
    }

    maxOffset (): number {
        return this.offset + this.length - 1
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

    replaceChildren (node: RopesNodes | null, by: RopesNodes | null): void {
        if (this.left === node) {
            this.left = by
        }
        else if (this.right === node) {
            this.right = by
        }
    }

    balanceScore (): number {
        return heightOf(this.right) - heightOf(this.left)
    }

    become (node: RopesNodes): void {
        this.sizeNodeAndChildren = -this.length + node.length
        this.length = node.length
        this.offset = node.offset
        this.block = node.block
    }

    isAppendableAfter (): boolean {
        return this.block.mine && this.block.idInterval.end === this.maxOffset()
    }

    isAppendableBefore (): boolean {
        return this.block.mine && this.block.idInterval.begin === this.offset
    }

    toString (): string {
        const current = (new IdentifierInterval(this.block.idInterval.base,
            this.offset, this.maxOffset())).toString()
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
        const idInterval = new IdentifierInterval(this.block.idInterval.base,
            this.offset, this.maxOffset())
        const leftList =  (this.left !== null) ? this.left.toList() : []
        const rightList = (this.right !== null) ? this.right.toList() : []
        return leftList.concat(idInterval, rightList)
    }

    getIdentifierInterval (): IdentifierInterval {
        return new IdentifierInterval(this.block.idInterval.base,
            this.offset, this.maxOffset())
    }

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
