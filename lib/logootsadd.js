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

var Identifier = require('./identifier');

var LogootSAdd = function (id, l) {
  console.assert(id instanceof Identifier);
	console.assert(typeof l === "string");

	this.id = id;
	this.l = l;
};

LogootSAdd.prototype.execute = function (doc) {
	var args = {
		'id': this.id,
		'str': this.l
	};
	return doc.addBlock(args);
};

module.exports = LogootSAdd;
