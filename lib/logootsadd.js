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
"use strict";

/**
 * This class represents a LogootSplit insert operation.
 * @constructor
 * @param {IdentifierInterval} id - the identifier that localise the insertion in the logoot sequence.
 * @param {string} content - the content of the block to be inserted.
 */
var LogootSAdd = function (id, l) {
	this.id = id;
	this.l = l;
};

/**
 * Apply the current insert operation to a LogootSplit document.
 * @param {LogootSDocument} doc - the LogootSplit document on which the operation wil be applied.
 * @return {TextInsert} the insertion to be applied on the sequence representing the document content.
 */
LogootSAdd.prototype.execute = function (doc) {
	var args = {
		'id': this.id,
		'str': this.l
	};
	return doc.addBlock(args);
};

module.exports = LogootSAdd;
