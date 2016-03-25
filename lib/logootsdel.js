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
var IdentifierInterval = require('./identifierinterval');

/**
* This class represents a LogootSplit delete operation.
* @constructor
* @param {IdentifierInterval[]} lid - the list of identifier that localise the deletion in the logoot sequence.
*/
var LogootSDel = function (lid) {
	this.lid = [];
	for(var i=0; i<lid.length; i++) {
		var id = new IdentifierInterval(lid[i].base, lid[i].begin, lid[i].end);
		this.lid.push(id);
	}
};

/**
* Copy constructor.
* FIXME to be removed - LogootSDel should be immutable!
*/
LogootSDel.prototype.copy = function () {
	var o = new LogootSDel([]);
	for(var i = 0; i < this.lid.length; i++) {
		o.lid.push(this.lid[i].copy());
	}
	return o;
};

/**
* Apply the current delete operation to a LogootSplit document.
* @param {LogootSDocument} doc - the LogootSplit document on which the deletions wil be performed.
* @return {TextDelete[]} the list of deletions to be applied on the sequence representing the document content.
*/
LogootSDel.prototype.execute = function (doc) {
	var deletions = [];
	for(var i=0; i<this.lid.length; i++) {
        Array.prototype.push.apply(deletions, doc.delBlock(this.lid[i]));
    }
    return deletions;
};

module.exports = LogootSDel;
