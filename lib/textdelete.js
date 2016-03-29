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

/**
 * This class represents a sequence operation (deletion).
 * @constructor
 * @param {integer} offset - the position of the first element to be deleted in the sequence.
 * @param {string} length - the length of the range to be deleted in the sequence.
 */
function TextDelete (offset, length) {
	console.assert(typeof offset === "number", "offset = ", offset);
	console.assert(typeof length === "number", "length = ", length);
	console.assert(length > 0, length, " > 0");

	this.offset = offset;
	this.length = length;
}

/**
 * Apply the current delete operation to a LogootSplit document.
 * @param {LogootSDocument} doc - the LogootSplit document on which the deletion wil be performed.
 * @return {LogootSDel} the logootsplit deletion that is related to the deletion that has been performed.
 */
TextDelete.prototype.applyTo = function (doc) {
	console.assert(arguments.length === 1);

	return doc.delLocal(this.offset, this.offset + this.length - 1);
};

module.exports = TextDelete;
