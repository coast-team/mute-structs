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


var LogootSDel = function (lid) {
	this.lid = [];
	for(var i=0; i<lid.length; i++) {
		var id = new IdentifierInterval(lid[i].base, lid[i].begin, lid[i].end);
		this.lid.push(id);
	}
};

LogootSDel.prototype.copy = function () {
	var o = new LogootSDel();
	o.lid = [];
	for(var i=0; i<this.lid.length; i++) {
		o.lid.push(lid[i].copy());
	}
	return o;
};

LogootSDel.prototype.execute = function (doc) {
	var l = [];
	for(var i=0; i<this.lid.length; i++) {
        Array.prototype.push.apply(l, doc.delBlock(this.lid[i]));
    }
    return l;
};

module.exports = LogootSDel;
