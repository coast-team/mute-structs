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

import { Identifier } from "../src/identifier"
import { IdentifierInterval } from "../src/identifierinterval"
import { IdentifierTuple } from "../src/identifiertuple"

export function idFactory (...values: number[]): Identifier {
    console.assert(values.length % 4 === 0, "values.length must be a multiple of 4")

    const groupedValues: Array<[number, number, number, number]> = []
    for (let i = 0; i < values.length; i = i + 4) {
        groupedValues.push([
            values[i],
            values[i + 1],
            values[i + 2],
            values[i + 3],
        ])
    }
    const tuples: IdentifierTuple[] =
        groupedValues.map(([random, replicaNumber, clock, offset]: [number, number, number, number]) => {
            return new IdentifierTuple(random, replicaNumber, clock, offset)
        })
    return new Identifier(tuples)
}

export function generateIdIntervalFactory (...values: number[]): (end: number) => IdentifierInterval {
    const id = idFactory(...values)
    return (end: number) => new IdentifierInterval(id, end)
}

export function generateStr (length: number): string {
    let text = ""
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length))
    }

    return text
}
