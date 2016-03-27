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

var InfiniteString = require('./infinitestring');
var Identifier = require('./identifier');


/**
 * Holds the minimum value an integer can have.
 */
var INT_32_MIN_VALUE = - 0x80000000;

/**
 * Holds the maximum value an integer can have.
 */
var INT_32_MAX_VALUE = 0x7fffffff;

module.exports = {
    createBetweenPosition: function (id1, id2, replicaNumber, clock) {
    		console.assert(id1 === null || id1 instanceof Identifier, "id1 = " + id1);
    		console.assert(id2 === null || id2 instanceof Identifier, "id2 = ", id2);
      	console.assert(typeof replicaNumber === "number", "replicaNumber = ", replicaNumber);
      	console.assert(typeof clock === "number", "clock = ", clock);

        var s1 = new InfiniteString(id1 !== null ? id1.base.concat(id1.last) : [], INT_32_MIN_VALUE);
        var s2 = new InfiniteString(id2 !== null ? id2.base.concat(id2.last) : [], INT_32_MAX_VALUE);
        var sb = [];

        do {
            var b1 = s1.next();
            var b2 = s2.next();
            if (b2 - b1 > 2) {
                var f = Math.random() * (b2 - b1 - 2);
                var i = f|0; // Truncate the float in order to get a 32bits int
                i = i + b1 + 1;
                sb.push(i);
                break;
            }
            else {
                sb.push(b1);
            }
        } while(true);
        sb.push(replicaNumber);
        sb.push(clock);
        return sb;
    }
};
