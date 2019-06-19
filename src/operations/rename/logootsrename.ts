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

import {isObject} from "../../data-validation"
import {Epoch} from "../../epoch/epoch"
import {IdentifierInterval} from "../../identifierinterval"
import {isInt32} from "../../int32"
import {RenamableReplicableList} from "../../renamablereplicablelist"
import {RenamableListOperation} from "../renamablelistoperation"
import {TextOperation} from "../textoperation"

/**
 * Represents a LogootSplit rename operation.
 */
export class LogootSRename extends RenamableListOperation {

    static fromPlain (o: unknown) {
        if (isObject<LogootSRename>(o) &&
            isInt32(o.replicaNumber) && isInt32(o.clock) &&
            Array.isArray(o.renamedIdIntervals) && o.renamedIdIntervals.length > 0) {

            const renamedIdIntervals = o.renamedIdIntervals.map(IdentifierInterval.fromPlain)
                .filter((v): v is IdentifierInterval => v !== null)
            const epoch = Epoch.fromPlain(o.epoch)

            if (epoch !== null &&
                o.renamedIdIntervals.length === renamedIdIntervals.length) {
                return new LogootSRename(o.replicaNumber, o.clock, epoch, renamedIdIntervals)
            }
        }
        return null
    }

    readonly replicaNumber: number
    readonly clock: number
    readonly renamedIdIntervals: IdentifierInterval[]

    /**
     * @constructor
     */
    constructor (replicaNumber: number, clock: number, epoch: Epoch,
                 renamedIdIntervals: IdentifierInterval[]) {

        super(epoch)
        this.replicaNumber = replicaNumber
        this.clock = clock
        this.renamedIdIntervals = renamedIdIntervals
    }

    get author (): number {
        return this.replicaNumber
    }

    execute (renamableList: RenamableReplicableList): TextOperation[] {
        renamableList.renameRemote(this.replicaNumber, this.clock, this.epoch, this.renamedIdIntervals)
        return []
    }
}
