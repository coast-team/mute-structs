/*
 *  Copyright 2016 Victorien Elvinger
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

module.exports = {
    insert: function (aOriginal, index, string) {
        console.assert(typeof aOriginal === "string", "aOriginal = ", aOriginal);
        console.assert(typeof index === "number", "index = ", index);
        console.assert(typeof string === "string", "string = ", string);

        var positiveIndex = Math.max(0, index);
        return aOriginal.slice(0, positiveIndex) +
            string +
            aOriginal.slice(positiveIndex);
    },

    del: function (aOriginal, begin, end) {
        console.assert(typeof aOriginal === "string", "aOriginal = ", aOriginal);
        console.assert(typeof begin === "number", "begin = ", begin);
        console.assert(typeof end === "number", "end = ", end);

        return aOriginal.slice(0, begin) +
            aOriginal.slice(end + 1);
    },

    occurrences: function (string, substring) {
        console.assert(typeof string === "string", "string = ", string);
        console.assert(typeof substring === "string", "substring = ", substring);

        var result = 0;
        var substringLength = substring.length;

        var pos = string.indexOf(substring);
        while (pos !== -1) {
        	result++;
        	pos = string.indexOf(substring, pos + substringLength);
        }

        return result;
    }

};
