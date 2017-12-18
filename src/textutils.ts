/*
    This file is part of MUTE-structs.

    Copyright (C) 2017  Matthieu Nicolas, Victorien Elvinger

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

/**
  * Insert a string at a specific position in an existing string.
  * @param {string} aOriginal - the string in which to insert the new content.
  * @param {number} index - the position where to perform the insertion.
  * @param {string} string - the string to be inserted.
  * @return {string} the resulting string aOriginal[0:index]+string+aOriginal[index+1:aOriginal.length-1].
  */
function insert (aOriginal: string, index: number, str: string): string {
    console.assert(Number.isSafeInteger(index), "index ∈ safe integer")

    const positiveIndex = Math.max(0, index)
    return aOriginal.slice(0, positiveIndex) +
        str +
        aOriginal.slice(positiveIndex)
}

/**
  * Remove a range of characters from a string.
  * @param {string} aOriginal - the string in which to insert the new content.
  * @param {number} begin - the beginning index of the range to be removed.
  * @param {number} end - the end index of the range to be removed.
  * @return {string} the resulting string aOriginal[0:begin]+aOriginal[end:aOriginal.length-1].
  */
function del (aOriginal: string, begin: number, end: number): string {
    console.assert(Number.isSafeInteger(begin), "begin ∈ safe integer")
    console.assert(Number.isSafeInteger(end), "end ∈ safe integer")

    return aOriginal.slice(0, begin) +
        aOriginal.slice(end + 1)
}

/**
  * Compute the number of disjoint-occurence of a string within a string.
  * @param {string} string - the string in which to count occurences.
  * @param {string} substring - the substring to look for.
  * @return {number} the occurence count.
  */
function occurrences (str: string, substring: string): number {
    let result = 0
    const substringLength = substring.length

    let pos = str.indexOf(substring)
    while (pos !== -1) {
        result++
        pos = str.indexOf(substring, pos + substringLength)
    }

    return result
}

export {insert, del, occurrences}
