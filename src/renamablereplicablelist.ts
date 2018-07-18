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

import {Epoch} from "./epoch/epoch"
import {EpochId} from "./epoch/epochid"
import {EpochStore} from "./epoch/epochstore"
import {LogootSRopes} from "./logootsropes"
import {RopesNodes} from "./ropesnodes"

export class RenamableReplicableList {

    readonly list: LogootSRopes
    readonly epochsStore: EpochStore
    readonly currentEpoch: Epoch

    constructor (replicaNumber: number, clock: number, root?: RopesNodes, str?: string) {
        this.list = new LogootSRopes(replicaNumber, clock, root, str)

        this.currentEpoch = new Epoch(new EpochId(0, 0))
        this.epochsStore = new EpochStore(this.currentEpoch)
    }

    get replicaNumber (): number {
        return this.list.replicaNumber
    }

    get clock (): number {
        return this.list.clock
    }
}
