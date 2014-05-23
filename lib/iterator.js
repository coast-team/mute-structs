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
var Iterator = function (it, more) {
	this.it = it || null;
	this.more = more || 0;
	this.nexte = 'a';
	this.loadNext();
};

Iterator.prototype.loadNext = function () {
	if(this.it.hasNext()) {
		this.nexte = this.it.next();
	}
	else {
		this.nexte = this.more;
		this.more = null;
	}
};

Iterator.prototype.hasNext = function () {
	return this.nexte!=null;
};

Iterator.prototype.next = function () {
	var ret = this.nexte;
	this.loadNext();
	return ret;
};

module.exports = Iterator;
