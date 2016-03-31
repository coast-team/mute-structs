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


function IdentifierInterval (base, begin, end) {
	console.assert(base instanceof Array, "base = ", base);
	console.assert(typeof begin === "number", "begin = ", begin);
	console.assert(typeof end === "number", "end = ", end);
	console.assert(begin <= end, "" + begin + " <= ", end);

	this.base = base;
	this.begin = begin;
	this.end = end;
}

IdentifierInterval.fromPlain = function (o) {
  // is is structurally an IdentifierInterval
  console.assert(typeof o === "object" &&
			o.base instanceof Array &&
			typeof o.begin === "number" &&
			typeof o.end === "number", "o = ", o);

	return new IdentifierInterval(o.base, o.begin, o.end);
};

IdentifierInterval.prototype.copy = function() {
	return new IdentifierInterval(this.base.slice(0), this.begin, this.end);
};

IdentifierInterval.prototype.getBaseId = function (u) {
	console.assert(typeof u === "number", "u = ", u);

	return new Identifier(this.base, u);
};

IdentifierInterval.prototype.getBeginId = function () {
	return this.getBaseId(this.begin);
};

IdentifierInterval.prototype.getEndId = function () {
	return this.getBaseId(this.end);
};

IdentifierInterval.prototype.toString = function () {
	return 'Id[' + this.base.join(",") + ', ' +
			this.begin + ' .. ' + this.end + ']';
};

module.exports = IdentifierInterval;
