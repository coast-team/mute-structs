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

import { SafeAny } from "safe-any"

export interface Dot {
    readonly replicaNumber: number
    readonly clock: number
}

export function isDot (dot: SafeAny<Dot>): dot is Dot {
    return typeof dot === "object" && dot !== null &&
        typeof dot.replicaNumber === "number" && Number.isInteger(dot.replicaNumber) &&
        typeof dot.clock === "number" && Number.isInteger(dot.clock)
}
