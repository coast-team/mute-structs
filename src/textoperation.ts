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

import {LogootSOperation} from "./logootsoperation"
import {LogootSRopes} from "./logootsropes"
import {TextDelete} from "./textdelete"
import {TextInsert} from "./textinsert"

export abstract class TextOperation {

    readonly index: number
    readonly author: number

    constructor (index: number, author: number) {
        this.index = index
        this.author = author
    }

    abstract applyTo (doc: LogootSRopes): LogootSOperation
}
