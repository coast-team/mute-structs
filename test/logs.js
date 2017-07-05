/*
 *	Copyright 2017 Matthieu Nicolas
 *
 *	This program is free software: you can redistribute it and/or modify
 *	it under the terms of the GNU General Public License as published by
 *	the Free Software Foundation, either version 3 of the License, or
 * 	(at your option) any later version.
 *
 *	This program is distributed in the hope that it will be useful,
 *	but WITHOUT ANY WARRANTY; without even the implied warranty of
 *	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *	GNU General Public License for more details.
 *
 *	You should have received a copy of the GNU General Public License
 *	along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import fs from "fs"
import test from "ava"
import {LogootSAdd} from "../lib/logootsadd.js"
import {LogootSDel} from "../lib/logootsdel.js"
import {LogootSRopes} from "../lib/logootsropes.js"

/**
 * Check if every element of the array provided is equals to the expected value
 *
 * @param {any[]} inputs - An array
 * @param {any} expected - The expected value of each element
 */
function everyEqualsTo(inputs, expected) {
	return inputs.every((input) => input === expected)
}

/**
 * Macro to check if all logs from a provided set converge
 *
 * @param {any} t - The test tool, provided by Ava
 * @param {string[]} logFiles - The set of files containing the logs to compare
 * @param {boolean} expected - Should the logs converge or not
 */
function everyLogsConvergeMacro(t, logFiles, expected) {
	const logs = []

	// Retrieve operation logs from files
	logFiles.forEach((file) => {
		const data = fs.readFileSync(file, 'utf8')
		const log = JSON.parse(data)
    const richLogootSOps = log.richLogootSOps

    const logootSOps = richLogootSOps.map((richLogootSOp) => {
      const logootSOp = richLogootSOp.logootSOp
      if (logootSOp.lid) {
        return LogootSDel.fromPlain(logootSOp)
      }
      return LogootSAdd.fromPlain(logootSOp)
    })

  	logs.push(logootSOps)
  })

	const docs = []
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

const logsPath = "../logs/logs-ct3"

const logFilesSet1 = [`${logsPath}/log-claudia-ct3.json`, `${logsPath}/log-long-ct3.json`]
test("convergent-logs-set-1", everyLogsConvergeMacro, logFilesSet1, true)

const logFilesSet2 = [`${logsPath}/log-le-ct3.json`, `${logsPath}/log-philippe-ct3.json`]
test("convergent-logs-set-2", everyLogsConvergeMacro, logFilesSet2, true)

const logFilesSet3 = [`${logsPath}/log-claudia-ct3.json`, `${logsPath}/log-philippe-ct3.json`]
test("divergent-logs-set-1", everyLogsConvergeMacro, logFilesSet3, false)
