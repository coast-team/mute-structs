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
 *  but WITHOUT ANY WARRANTY without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with Mute-structs.  If not, see <http://www.gnu.org/licenses/>.
 */

export class InfiniteString <G> {

    constructor (aPrefix: G[], aFiller: G) {
        console.assert(aPrefix instanceof Array, "aPrefix = ", aPrefix)
        console.assert(typeof aFiller !== "undefined")

        this.filler = aFiller
        this.prefix = aPrefix
        this.currentIndex = 0
    }

    readonly filler: G

    readonly prefix: G[]

    private currentIndex: number

    next (): G {
        if (this.currentIndex < this.prefix.length) {
            const result = this.prefix[this.currentIndex]
            this.currentIndex++
            return result
        } else {
            return this.filler
        }
    }

}

