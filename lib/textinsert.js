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
 /**
 * This class represents a sequence operation (insert).
 * @constructor
 * @param {integer} offset - the insertion position in the sequence.
 * @param {string} content - the content to be inserted in the sequence.
 */
var TextInsert = function (offset, content)  {
	this.offset = offset || 0;
	this.content = content || null;
};

/**
* Apply the current insert operation to a LogootSplit document.
* @param {LogootSDocument} doc - the LogootSplit document on which the insertion wil be performed.
* @return {LogootSAdd} the logootsplit insertion that is related to the insertion that has been performed.
*/
TextInsert.prototype.applyTo = function (doc) {
	return doc.insertLocal(this.offset, this.content);
};

module.exports = TextInsert;
