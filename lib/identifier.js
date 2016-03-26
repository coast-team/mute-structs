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

/*global console, module */
"use strict";

var Identifier = function(base, u) {
	 console.assert(base instanceof Array);
   	console.assert(typeof u === "number");

    this.base = base;
    this.last = u;
};

Identifier.prototype.compareTo = function(aOther) {
		console.assert(aOther instanceof Identifier);

    var extended = this.base.concat(this.last);
    var otherExtended = aOther.base.concat(aOther.last);
    var minLength = Math.min(extended.length, otherExtended.length);

    var i = 0;
    while (i < minLength && extended[i] === otherExtended[i]) {
        i++;
    }

    if (i === minLength) {
        if (extended.length > minLength) {
            return 1;
        }
        else if (otherExtended.length > minLength) {
            return -1;
        }
        else {
            return 0;
        }
    }
    else {
        if (extended[i] < otherExtended[i]) {
            return -1;
        }
        else {
            return 1;
        }
    }
};

Identifier.prototype.toString = function() {
    return "Identifier{" + this.base.join(",") + "," + this.last + '}';
};

Identifier.prototype.copy = function() {
    return new Identifier(this.base.slice(0), this.last);
};

Identifier.prototype.hasPlaceAfter = function(next, length) {
		console.assert(next instanceof Identifier);
    console.assert(typeof length === "number");

    var max = length + this.last;
    var base = this.base;
    var nextExtended = next.base.concat(next.last);
    var minLength = Math.min(base.length, nextExtended.length);

    var i = 0;
    while (i < minLength && base[i] === nextExtended[i]) {
        i++;
    }

    return i === minLength &&
        (i >= nextExtended.length || nextExtended[i] >= max);
};

Identifier.prototype.hasPlaceBefore = function(prev, length) {
		console.assert(prev instanceof Identifier);
    console.assert(typeof length === "number");

    var min = this.last - length;
    var base = this.base;
    var prevExtended = prev.base.concat(prev.last);
    var minLength = Math.min(base.length, prevExtended.length);

    var i = 0;
    while (i < minLength && base[i] === prevExtended[i]) {
        i++;
    }

    return i === minLength &&
        (i >= prevExtended.length || prevExtended[i] < min);
};

Identifier.prototype.minOffsetAfterPrev = function (prev, min) {
		console.assert(prev instanceof Identifier);
  	console.assert(typeof min === "number");

    var base = this.base;
    var prevExtended = prev.base.concat(prev.last);
    var minLength = Math.min(base.length, prevExtended.length);

    var i = 0;
    while (i < minLength && base[i] === prevExtended[i]) {
        i++;
    }

    if (i === minLength && i < prevExtended.length) {
        // base is a prefix of prevBase
        return Math.max(prevExtended[i] + 1, min);
    }
    else {
        return min;
    }
};

Identifier.prototype.maxOffsetBeforeNex = function (next, max) {
		console.assert(next instanceof Identifier);
  	console.assert(typeof max === "number");

    var base = this.base;
    var nextExtended = next.base.concat(next.last);
    var minLength = Math.min(base.length, nextExtended.length);

    var i = 0;
    while (i < minLength && base[i] === nextExtended[i]) {
        i++;
    }

    if (i === minLength && i < nextExtended.length) {
        // base is a prefix of nextBase
        return Math.max(nextExtended[i], max);
    }
    else {
        return max;
    }
};

module.exports = Identifier;
