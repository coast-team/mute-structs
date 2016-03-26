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
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with Mute-structs.  If not, see <http://www.gnu.org/licenses/>.
 */

/*global console, module, require */
"use strict";

var IdentifierInterval = require('./identifierinterval');
var LogootSBlock = require('./logootsblock');

/**
 * @param aNode may be null
 * @returns Height of aNode or 0 if aNode is null
 */
var heightOf = function (aNode) {
	if (aNode !== null) {
		return aNode.height;
	}
	else {
		return 0;
	}
};

/**
 * @param aNode may be null
 * @returns size of aNode (including children sizes) or 0 if aNode is null
 */
var subtreeSizeOf = function (aNode) {
	if (aNode !== null) {
		return aNode.sizeNodeAndChildren;
	}
	else {
		return 0;
	}
};


var RopesNodes = function (args) {
	console.assert(typeof args === "object");

	this.block = args.block || null;
	this.offset = args.offset || 0;
	this.length = args.length || 0;
	this.sizeNodeAndChildren = this.length;
	this.left = args.left || null;
	this.right = args.right || null;
	this.height = args.height || 1;
	var newer = args.newer || true;
	if(newer && this.block !== null) {
		try {
			this.block.addBlock(this.offset, this.length);
		}
		catch (e) {
			console.error('---- Exception dans new RopesNodes lors d\'addBlock ----');
			console.error('Args : ', args);
			console.error('Newer : ', newer);
			console.error('This : ', this);
		}
	}
};

RopesNodes.fromJSON = function (node) {
 	return new RopesNodes({
		height: node.height,
		offset: node.offset,
		length: node.sizeNodeAndChildren,
		block: LogootSBlock.fromJSON(node.block),
		left: (node.hasOwnProperty("left") && node.left !== null) ?
				RopesNodes.fromJSON(node.left) :
				null,
		right: (node.hasOwnProperty("right") && node.right !== null) ?
				RopesNodes.fromJSON(node.right) :
				null
	});
};

RopesNodes.leaf = function (aBlock, aOffset, aLength) {
	console.assert(aBlock instanceof LogootSBlock);
	console.assert(typeof aOffset === "number");
	console.assert(typeof aLength === "number");
	console.assert(aLength > 0);

	return new RopesNodes({
		block: aBlock,
		offset: aOffset,
		length: aLength,
		height: 1,
		left: null,
		right: null
	});
};

RopesNodes.prototype.getIdBegin = function () {
	return this.block.id.getBaseId(this.offset);
};

RopesNodes.prototype.getIdEnd = function () {
	return this.block.id.getBaseId(this.offset + this.length - 1);
};

RopesNodes.prototype.copy = function() {
	var o = new RopesNodes({
		block: this.block !== null ? this.block.copy() : null,
		offset: this.offset,
		length: this.length,
	});
	o.height = this.height;
	o.left = this.left !== null ? this.left.copy() : null;
	o.right = this.right !== null ? this.right.copy() : null;

	return o;
};

RopesNodes.prototype.addString = function (length) {
	console.assert(typeof length === "number");
	console.assert(length > 0);

	this.sizeNodeAndChildren += length;
};

RopesNodes.prototype.appendEnd = function (length) {
	console.assert(typeof length === "number");
	console.assert(length > 0);

	var b = this.maxOffset() + 1;
	this.length += length;
	this.block.addBlock(b, length);
	return this.block.id.getBaseId(b);
};

RopesNodes.prototype.appendBegin = function (length) {
	console.assert(typeof length === "number");
	console.assert(length > 0);

	this.offset -= length;
	this.length += length;
	this.block.addBlock(this.offset, length);
	return this.getIdBegin();
};

RopesNodes.prototype.deleteOffsets = function (begin, end) {
	console.assert(typeof begin === "number");
	console.assert(typeof end === "number");
	console.assert(begin <= end);

	var sizeToDelete = end - begin + 1;
	this.block.delBlock(begin, end, sizeToDelete);
	if (sizeToDelete === this.length) {
		this.length = 0;
		return null;
	}
	var ret = null;
	if (end === (this.offset + this.length - 1)) {
		this.length = begin - this.offset;
	}
	else if (begin === this.offset) {
		this.length = this.length - end + this.offset - 1;
		this.offset = end + 1;
	}
	else {
		ret = this.split({
			size: (end - this.offset + 1)
		});
		this.length = begin - this.offset;
	}
	return ret;
};

RopesNodes.prototype.split = function (args) {
	console.assert(typeof args === "object");
	console.assert(typeof args.size === "number");
	var size = args.size;
	var n;

	if (args.hasOwnProperty("node")) {
		console.assert(args.node instanceof RopesNodes);

		this.height++;
		n = this.split({
			size: size
		});
		n.left = args.node;
		n.height++;
		return n;
	}
	else {
		this.height++;
		n = new RopesNodes({
			length: this.length - size,
			offset: this.offset + size,
			block: this.block,
			newer: false
		});
		this.length = size;
		if (this.right !== null) {
			n.right = this.right;
			n.height += n.right.height + 1;
			n.sizeNodeAndChildren += n.right.sizeNodeAndChildren;
		}
		this.right = n;
		return n;
	}
};

RopesNodes.prototype.maxOffset = function() {
	return this.offset + this.length - 1;
};

RopesNodes.prototype.leftSubtreeSize = function () {
		return subtreeSizeOf (this.left);
};

RopesNodes.prototype.rightSubtreeSize = function () {
		return subtreeSizeOf (this.right);
};

RopesNodes.prototype.sumDirectChildren = function () {
	this.height = Math.max(heightOf(this.left), heightOf(this.right)) + 1;
	this.sizeNodeAndChildren = this.leftSubtreeSize() + this.rightSubtreeSize() + this.length;
};

RopesNodes.prototype.replaceChildren = function (node, by) {
	if (this.left === node) {
		this.left = by;
	}
	else if (this.right === node) {
		this.right = by;
	}
};

RopesNodes.prototype.balanceScore = function () {
	return heightOf(this.right) - heightOf(this.left);
};

RopesNodes.prototype.become = function (node) {
	this.sizeNodeAndChildren = -this.length + node.length;
	this.length = node.length;
	this.offset = node.offset;
	this.block = node.block;
};

RopesNodes.prototype.isAppendableAfter = function () {
	return this.block.mine && this.block.id.end === this.maxOffset();
};

RopesNodes.prototype.isAppendableBefore = function () {
	return this.block.mine && this.block.id.begin === this.offset;
};

RopesNodes.prototype.toString = function () {
	var current = (new IdentifierInterval(this.block.id.base,
		this.offset, this.maxOffset())).toString();
	var leftToString = (this.left !== null) ? this.left.toString() : "-";
	var rightToString = (this.right !== null) ? this.right.toString() : "-";
	return "(" + leftToString + " " + current + " " + rightToString + ")";
};

RopesNodes.prototype.viewRec = function () {
	var str2 = '';
	if (this.left !== null || this.right !== null) {
		str2 += '( ';
	}
	if (this.left !== null) {
		str2 += this.left.viewRec();
	}
	if (this.left !== null || this.right !== null) {
		str2 += ' //,// ';
	}
	str2 += this.str;
	if (this.left !== null || this.right !== null) {
		str2 += ' \\\\,\\\\ ';
	}
	if (this.right !== null) {
		str2 += this.right.viewRec();
	}
	if (this.left !== null || this.right !== null) {
		str2 += ' )';
	}
	return str2;
};

RopesNodes.prototype.getIdentifierInterval = function () {
	return new IdentifierInterval(this.block.id.base, this.offset, this.offset + this.length - 1);
};

module.exports = RopesNodes;
