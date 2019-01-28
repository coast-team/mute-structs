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

import { isObject } from "../data-validation"
import { isInt32 } from "../int32"

export class EpochId {

    static fromPlain (o: unknown): EpochId | null {
        if (isObject<EpochId>(o) && isInt32(o.replicaNumber) &&
            isInt32(o.epochNumber)) {

            return new EpochId(o.replicaNumber, o.epochNumber)
        }
        return null
    }

    readonly replicaNumber: number
    readonly epochNumber: number

    constructor (replicaNumber: number, epochNumber: number) {
        this.replicaNumber = replicaNumber
        this.epochNumber = epochNumber
    }

    get asStr (): string {
        return `${this.replicaNumber},${this.epochNumber}`
    }
}
