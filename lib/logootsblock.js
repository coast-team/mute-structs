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


function LogootSBlock (id, list) {
	console.assert(id instanceof IdentifierInterval, "id = ", id);
	console.assert(typeof list === "number", "list = ", list);
	console.assert(list >= 0, list, ">= 0");

	this.id = id;
	this.nbElement = list;
	this.mine = false;
}

LogootSBlock.fromJSON = function (o) {
		console.assert(typeof o === "object" &&
			typeof o.id === "object" && o.id.base instanceof Array &&
			typeof o.begin === "number" && typeof o.end === "number" &&
			typeof o.nbElement === "number", "o = ", o);

    var id = new IdentifierInterval(o.id.base, o.begin, o.end);
    return new LogootSBlock(id, o.nbElement);
};

LogootSBlock.prototype.addBlock = function(pos, length) {
		console.assert(typeof pos === "number", "pos = ", pos);
		console.assert(typeof length === "number", "length = ", length);
		console.assert(length > 0, length, "> 0");

    this.nbElement += length;
    this.id.begin = Math.min(this.id.begin, pos);
    this.id.end = Math.max(this.id.end, pos + length - 1);
};

LogootSBlock.prototype.delBlock = function(begin, end, nbElement) {
	console.assert(typeof begin === "number", "begin = ", begin);
	console.assert(typeof end === "number", "end = ", end);
	console.assert(typeof nbElement === "number", "nbElement = ", nbElement);
	console.assert(nbElement > 0, nbElement, " > 0");

	this.nbElement -= nbElement;
};

LogootSBlock.prototype.copy = function() {
	return new LogootSBlock(this.id.copy(), this.nbElement);
};

LogootSBlock.prototype.toString = function() {
	return '{' + this.nbElement + ',' + this.id.toString() + ', ' + (this.mine ? 'mine' : 'its') + '}';
};

module.exports = LogootSBlock;
