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

var arrayConcat = Array.prototype.concat;

/**
 * This class represents a LogootSplit delete operation.
 * @constructor
 * @param {IdentifierInterval[]} lid - the list of identifier that localise the deletion in the logoot sequence.
 */
function LogootSDel (lid) {
  console.assert(lid instanceof Array &&
    lid.every(function (item) {
  		return typeof item === "object" && item.hasOwnProperty("base") &&
          item.hasOwnProperty("begin") && item.hasOwnProperty("end");
  	}), "lid = ", lid);

	this.lid = lid.map(IdentifierInterval.fromPlain);
}

/**
 * Apply the current delete operation to a LogootSplit document.
 * @param {LogootSDocument} doc - the LogootSplit document on which the deletions wil be performed.
 * @return {TextDelete[]} the list of deletions to be applied on the sequence representing the document content.
 */
LogootSDel.prototype.execute = function (doc) {
	return arrayConcat.apply([], this.lid.map(function (aId) {
		return doc.delBlock(aId);
	}));
};

module.exports = LogootSDel;
