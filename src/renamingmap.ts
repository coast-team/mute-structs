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

import {findPredecessor, flatten} from "./helpers"
import {Identifier} from "./identifier"
import {IdentifierInterval} from "./identifierinterval"
import {createAtPosition} from "./idfactory"

export class RenamingMap {

    readonly replicaNumber: number
    readonly clock: number
    readonly renamedIds: Identifier[]
    readonly map: Map<number, Map<number, Map<number, number>>>

    constructor (replicaNumber: number, clock: number, renamedIdIntervals: IdentifierInterval[]) {
        this.replicaNumber = replicaNumber
        this.clock = clock
        this.renamedIds = []
        this.map = new Map()

        let newOffset = 0
        renamedIdIntervals
            .map((idInterval: IdentifierInterval) => idInterval.toIds())
            .reduce(flatten)
            .forEach((id: Identifier) => {
                this.renamedIds.push(id)

                if (!this.map.has(id.replicaNumber)) {
                    this.map.set(id.replicaNumber, new Map())
                }
                const clockMap: Map<number, Map<number, number>> =
                    this.map.get(id.replicaNumber) as Map<number, Map<number, number>>

                if (!clockMap.has(id.clock)) {
                    clockMap.set(id.clock, new Map())
                }

                const offsetMap: Map<number, number> =
                    clockMap.get(id.clock) as Map<number, number>

                offsetMap.set(id.lastOffset, newOffset)
                newOffset++
            })
    }

    getNewId (id: Identifier): Identifier {
        const replicaNumber = id.replicaNumber
        const clock = id.clock
        const offset = id.lastOffset
        if (this.map.has(replicaNumber)) {
            const clockMap = this.map.get(replicaNumber) as Map<number, Map<number, number>>
            if (clockMap.has(clock)) {
                const offsetMap = clockMap.get(clock) as Map<number, number>
                if (offsetMap.has(offset)) {
                    const newOffset = offsetMap.get(offset) as number
                    return createAtPosition(this.replicaNumber, this.clock, 0, newOffset)
                }
            }
        }

        // The submitted id was not part of the renaming, need to compute a new one
        const compareIds = (a: Identifier, b: Identifier) => a.compareTo(b)
        const predecessorId: Identifier | undefined = findPredecessor(this.renamedIds, id, compareIds)
        const newPredecessorId = predecessorId !== undefined ?
            this.getNewId(predecessorId) : createAtPosition(this.replicaNumber, this.clock, -10, 0)

        return newPredecessorId.concat(id)
    }
}
