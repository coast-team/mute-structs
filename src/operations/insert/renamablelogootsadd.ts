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
import {RenamableReplicableList} from "../../renamablereplicablelist"
import {RenamableLogootSOperation} from "../renamablelogootsoperation"
import {TextOperation} from "../textoperation"
import {LogootSAdd} from "./logootsadd"

export class RenamableLogootSAdd extends RenamableLogootSOperation<LogootSAdd> {

    static fromPlain (o: unknown): RenamableLogootSAdd | null {
        if (isObject<RenamableLogootSAdd>(o)) {
            const op = LogootSAdd.fromPlain(o.op)
            const epoch = Epoch.fromPlain(o.epoch)

            if (op !== null && epoch !== null) {
                return new RenamableLogootSAdd(op, epoch)
            }
        }
        return null
    }

    constructor (op: LogootSAdd, epoch: Epoch) {
        super(op, epoch)
    }

    execute (renamableList: RenamableReplicableList): TextOperation[] {
        return renamableList.insertRemote(this.epoch, this.op)
    }
}
