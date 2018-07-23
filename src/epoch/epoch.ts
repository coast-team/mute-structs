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

import {SafeAny} from "safe-any"

import {EpochId} from "./epochid"

export class Epoch {

    readonly id: EpochId
    readonly parentId?: EpochId

    constructor (id: EpochId, parentId?: EpochId) {
        console.assert((id.epochNumber !== 0 && parentId !== undefined)
            || (id.epochNumber === 0 && parentId === undefined),
            "Every epoch, except the 0 one, should have a parentId")

        this.id = id
        this.parentId = parentId
    }

    /**
     * Check if two instances of epochs are equal
     *
     * @param {Epoch} other The other epoch to which to compare
     * @return {boolean} Are the two epochs equal
     */
    equals (other: Epoch): boolean {
        const areParentsEqual =
            (this.parentId === undefined && other.parentId === undefined) ||
            (this.parentId !== undefined && other.parentId !== undefined &&
            this.parentId.replicaNumber === other.parentId.replicaNumber &&
            this.parentId.epochNumber === other.parentId.epochNumber)

        return areParentsEqual &&
            this.id.replicaNumber === other.id.replicaNumber &&
            this.id.epochNumber === other.id.epochNumber
    }
}
