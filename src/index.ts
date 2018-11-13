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
export { Dot, isDot } from "./dot"
export { IdentifierTuple } from "./identifiertuple"
export { Identifier } from "./identifier"
export { IdentifierInterval } from "./identifierinterval"

export { LogootSBlock } from "./logootsblock"
export { LogootSRopes } from "./logootsropes"
export { RopesNodes } from "./ropesnodes"

export { LogootSDel } from "./operations/delete/logootsdel"
export { TextDelete } from "./operations/delete/textdelete"
export { LogootSAdd } from "./operations/insert/logootsadd"
export { TextInsert } from "./operations/insert/textinsert"
export { LogootSOperation } from "./operations/logootsoperation"
export { TextOperation } from "./operations/textoperation"

export { BasicStats, Stats } from "./stats"

export { insert, del, occurrences } from "./textutils"
