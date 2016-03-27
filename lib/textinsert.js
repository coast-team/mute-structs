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

var TextInsert = function (offset, content) {
	console.assert(typeof offset === "number");
	console.assert(typeof content === "string");

	this.offset = offset;
	this.content = content;
};

TextInsert.prototype.applyTo = function (doc) {
	console.assert(arguments.length === 1);

	return doc.insertLocal(this.offset, this.content);
};

module.exports = TextInsert;
