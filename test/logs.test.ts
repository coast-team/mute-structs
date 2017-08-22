/*
 *  Copyright 2017 Matthieu Nicolas
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import test from "ava"
import {AssertContext} from "ava"
import * as fs from "fs"
import {SafeAny} from "safe-any"

import {LogootSAdd} from "../src/logootsadd.js"
import {LogootSDel} from "../src/logootsdel.js"
import {LogootSOperation} from "../src/logootsoperation.js"
import {LogootSRopes} from "../src/logootsropes.js"

/**
 * Check if every element of the array provided is equals to the expected value
 *
 * @param {T[]} inputs - An array
 * @param {any} expected - The expected value of each element
 */
function everyEqualsTo<T>(inputs: T[], expected: T): boolean {
  return inputs.every((input) => input === expected)
}

/**
 * Macro to check if all logs from a provided set converge
 *
 * @param {AssertContext} t - The test tool, provided by Ava
 * @param {string[]} logFiles - The set of files containing the logs to compare
 * @param {boolean} expected - Should the logs converge or not
 */
function everyLogsConvergeMacro(t: AssertContext, logFiles: string[], expected: boolean): void {
  const logs: LogootSOperation[][] = []

  // Retrieve operation logs from files
  logFiles.forEach((file) => {
    const data = fs.readFileSync(file, 'utf8')
    const log = JSON.parse(data)

    // Has to set explicitly the type of richLogootSOps
    // so that TypeScript does its job and infers the return type of richLogootSOps.map(...)
    const richLogootSOps: SafeAny<{richLogootSOps: SafeAny<LogootSOperation>[]}> = log.richLogootSOps


    if (richLogootSOps instanceof Array && richLogootSOps.length > 0) {
      let isOk = true
      let i = 0

      const logootSOps: LogootSOperation[] = []

      while (isOk && i < richLogootSOps.length) {
        const plainLogootSOp: SafeAny<LogootSOperation> = richLogootSOps[i].logootSOp
        let logootSOp: LogootSOperation | null = LogootSDel.fromPlain(plainLogootSOp)
        if (logootSOp === null) {
          logootSOp = LogootSAdd.fromPlain(plainLogootSOp)
        }
        if (logootSOp === null) {
          isOk = false
        } else {
          logootSOps.push(logootSOp)
        }
        i++
      }

      if (isOk) {
        logs.push(logootSOps)
      } else {
        t.fail("the log must contains only valid logoots operations")
      }
    } else {
      t.fail("the log must not be empty")
    }
  })
  const docs: LogootSRopes[] = []
  let i = 0

  // Replay operation logs
  logs.forEach((log) => {
    const doc = new LogootSRopes(i)

    log.forEach((logootSOp) => {
      logootSOp.execute(doc)
    })

    docs.push(doc)
    i++
  })

  const actualDigests = docs.map((doc) => doc.digest())
  const expectedDigest = actualDigests[0]

  const actualStrings = docs.map((doc) => doc.str)
  const expectedString = actualStrings[0]

  t.is(everyEqualsTo(actualDigests, expectedDigest), expected)
  t.is(everyEqualsTo(actualStrings, expectedString), expected)
}

const ct3LogsPath = "logs/logs-ct3"
const ct3LogsSet1 = [`${ct3LogsPath}/log-claudia-ct3.json`, `${ct3LogsPath}/log-long-ct3.json`]
const ct3LogsSet2 = [`${ct3LogsPath}/log-le-ct3.json`, `${ct3LogsPath}/log-philippe-ct3.json`]
const ct3LogsSet3 = [`${ct3LogsPath}/log-claudia-ct3.json`, `${ct3LogsPath}/log-philippe-ct3.json`]

test("convergent-logs-ct3-set-1", everyLogsConvergeMacro, ct3LogsSet1, true)
test("convergent-logs-ct3-set-2", everyLogsConvergeMacro, ct3LogsSet2, true)
test("divergent-logs-ct3-set-1", everyLogsConvergeMacro, ct3LogsSet3, false)

const ct17LogsPath = "logs/logs-ct17"
const ct17LogFile = "log-ct17-genius-shallow-program"
const ct17Users = ["claudia", "gerald", "laurent", "philippe", "vinh"]
const ct17LogsSet1 = ct17Users.map((user) => `${ct17LogsPath}/${ct17LogFile}-${user}.json`)
test("convergent-logs-ct17-set-1", everyLogsConvergeMacro, ct17LogsSet1, true)
