// Copyright (c) 2018 Victorien Elvinger
//
// Licensed under the zlib license (https://opensource.org/licenses/zlib).
//
// This file is part of replayable-random
// (https://github.com/Conaclos/replayable-random)

/* tslint:disable */

export type NonFunctionNames <T> =
    { [k in keyof T]: T[k] extends Function ? never : k }[keyof T]

export type Unknown <T> = { [k in NonFunctionNames<T>]?: unknown }

/**
 * Example:
 * Given `x: unknown`
 * `isObject<{ p: number }>(x) && typeof x.p === "number"`
 * enables to test if x is conforms to `{ p: number }`.
 *
 * @param x
 * @param Is `x' a non-null object?
 */
export const isObject = <T> (x: unknown): x is Unknown<T> =>
    typeof x === "object" && x !== null
