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
var IdentifierInterval = function(base, begin, end) {
	this.base = base || [];
	this.begin = begin || 0;
	this.end = end || 0;
};

IdentifierInterval.prototype.copy = function() {
	return new IdentifierInterval(Utils.copy(this.base), this.begin, this.end);
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

IdentifierInterval.prototype.equals = function (o) {
	if(this==o) return true;
	if(typeof(o) != typeof(this)) return false;

	if(o.begin!=this.begin) return false;
	if(o.end!=this.end) return false;
	if (this.base != null ? !this.base.equals(o.base) : o.base != null) return false;

	return true;
};

IdentifierInterval.prototype.hashCode = function () {
	var result = this.base != null ? base.hashCode() : 0;
    result = 31 * result + this.begin;
    result = 31 * result + this.end;
    return result;
};

IdentifierInterval.prototype.toString = function () {
	return 'IdentifierInterval{[' + this.base + '],[' + this.begin + '..' + this.end + ']}';
}

module.exports = IdentifierInterval;
