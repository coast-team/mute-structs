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
var InfiniteString = function(aPrefix, aFiller) {
	this.filler = aFiller;
	this.prefix = aPrefix;
	this.currentIndex = 0;
};

InfiniteString.prototype.hasNext = function () {
	return true;
};

InfiniteString.prototype.next = function () {
		if(this.currentIndex < this.prefix.length) {
				return this.prefix[this.currentIndex];
		}
		else {
				return this.filler;
		}
};

module.exports = InfiniteString;
