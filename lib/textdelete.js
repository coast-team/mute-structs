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

/*global console, module */
"use strict";

var TextDelete = function (offset, length) {
	console.assert(typeof offset === "number");
	console.assert(typeof length === "number");
	console.assert(length > 0);

	this.offset = offset;
	this.length = length;
};

TextDelete.prototype.applyTo = function (doc) {
	console.assert(arguments.length === 1);

	return doc.delLocal(this.offset, this.offset + this.length - 1);
};

module.exports = TextDelete;
