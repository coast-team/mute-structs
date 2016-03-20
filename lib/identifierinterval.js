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

var Identifier = require('./identifier');


var IdentifierInterval = function(base, begin, end) {
	this.base = base || [];
	this.begin = begin || 0;
	this.end = end || 0;
};

IdentifierInterval.prototype.copy = function() {
	return new IdentifierInterval(this.base.slice(0), this.begin, this.end);
};

IdentifierInterval.prototype.getBaseId = function (u) {
	return new Identifier(this.base, u);
};

IdentifierInterval.prototype.addBegin = function (begin) {
	this.begin += begin;
};

IdentifierInterval.prototype.addEnd = function (end) {
	this.end += end;
};

IdentifierInterval.prototype.getBeginId = function () {
	return new Identifier(this.base, this.begin);
};

IdentifierInterval.prototype.getEndId = function () {
	return new Identifier(this.base, this.end);
};

IdentifierInterval.prototype.toString = function () {
	return 'IdentifierInterval{[' + this.base.join(",") + '],[' + this.begin + '..' + this.end + ']}';
};

module.exports = IdentifierInterval;
