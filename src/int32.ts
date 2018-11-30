/*
    This file is part of Mute-structs.

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

export const INT32_BOTTOM = - 0x7fffffff - 1
export const INT32_TOP = 0x7fffffff

/**
 * @param n
 * @return Is `n' an int32?
 */
export function isInt32 (n: unknown): n is number {
    return typeof n === "number" &&
        Number.isSafeInteger(n) && INT32_BOTTOM <= n && n <= INT32_TOP
}

/**
 * @param l lower bound
 * @param u upper bound
 * @return random integer 32 in [l, u[
 */
export function randomInt32 (l: number, u: number): number {
    console.assert(isInt32(l), "l must be an int32")
    console.assert(isInt32(u), "u must be an int32")
    console.assert(l < u, "u is greater than l")

    const randomFloat = (Math.random() * (u - l)) + l
        // Generate a random float number in [b1, b2[
    const result = Math.floor(randomFloat)

    console.assert(isInt32(result) && l <= result && result < u,
        "result is an integer 32 in [l, u[")
    return result
}
