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

import {isObject} from "./data-validation"
import {isInt32} from "./int32"

export interface Dot {
    readonly replicaNumber: number
    readonly clock: number
}

export function isDot (dot: unknown): dot is Dot {
    return isObject<Dot>(dot) &&
        isInt32(dot.replicaNumber) && isInt32(dot.clock)
}
