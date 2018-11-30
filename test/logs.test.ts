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

import test from "ava"
import {AssertContext} from "ava"
import * as fs from "fs"

import {LogootSRopes} from "../src/logootsropes.js"
import {LogootSDel} from "../src/operations/delete/logootsdel.js"
import {LogootSAdd} from "../src/operations/insert/logootsadd.js"
import {LogootSOperation} from "../src/operations/logootsoperation.js"

/**
 * Check if every element of the array provided is equals to the expected value
 *
 * @param {T[]} inputs - An array
 * @param {any} expected - The expected value of each element
 */
function everyEqualsTo<T> (inputs: T[], expected: T): boolean {
    return inputs.every((input) => input === expected)
}

/**
 * Macro to check if all logs from a provided set converge
 *
 * @param {AssertContext} t - The test tool, provided by Ava
 * @param {string[]} logFiles - The set of files containing the logs to compare
 * @param {boolean} expected - Should the logs converge or not
 */
function everyLogsConvergeMacro (t: AssertContext, logFiles: string[], expected: boolean): void {
    const logs: LogootSOperation[][] = []

    // Retrieve operation logs from files
    logFiles.forEach((file) => {
        const data = fs.readFileSync(file, "utf8")
        const log = JSON.parse(data)

        // Has to set explicitly the type of richLogootSOps
        // so that TypeScript does its job and infers the return type of richLogootSOps.map(...)
        const richLogootSOps: unknown = log.richLogootSOps

        if (richLogootSOps instanceof Array && richLogootSOps.length > 0) {
            let isOk = true
            let i = 0

            const logootSOps: LogootSOperation[] = []

            while (isOk && i < richLogootSOps.length) {
                const plainLogootSOp: unknown = {
                    ...richLogootSOps[i].logootSOp,
                    author: richLogootSOps[i].id,
                }
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
    let j = 0

    // Replay operation logs
    logs.forEach((log) => {
        const doc = new LogootSRopes(j)

        log.forEach((logootSOp) => {
            logootSOp.execute(doc)
        })

        docs.push(doc)
        j++
    })

    const actualDigests = docs.map((doc) => doc.digest())
    const expectedDigest = actualDigests[0]

    const actualStrings = docs.map((doc) => doc.str)
    const expectedString = actualStrings[0]

    t.is(everyEqualsTo(actualDigests, expectedDigest), expected)
    t.is(everyEqualsTo(actualStrings, expectedString), expected)
}

function testConvergentLogs (
    testName: string,
    logsPath: string, logName: string, users: string[]): void {

    const logsSet = users.map((user) => `${logsPath}/${logName}-${user}.json`)
    test(testName, everyLogsConvergeMacro, logsSet, true)
}

function testDivergentLogs (
    testName: string,
    logsPath: string, logName: string, users: string[]): void {

    const logsSet = users.map((user) => `${logsPath}/${logName}-${user}.json`)
    test(testName, everyLogsConvergeMacro, logsSet, false)
}

testConvergentLogs(
  "convergent-logs-AKj-set",
  "logs/logs-AKjlI6j4yD",
  "log-AKjlI6j4yD-combat-salary-clara",
  ["1", "2", "3"])

testConvergentLogs(
  "convergent-logs-4u0-set",
  "logs/logs-4u0HUYhI3a",
  "log-4u0HUYhI3a-amigo-pilot-verbal",
  ["1", "2", "3"])

testConvergentLogs(
  "convergent-logs-iWY-set",
  "logs/logs-iWYksvoqJo",
  "log-iWYksvoqJo-holiday-field-summer",
  ["1", "2", "3"])

testConvergentLogs(
  "convergent-logs-20170117-test1-set",
  "logs/logs-20170117-test1",
  "log-20170117-test1-village-august-immune",
  ["1", "2"])

testConvergentLogs(
  "convergent-logs-20170117-test2-set",
  "logs/logs-20170117-test2",
  "log-20170117-test2-galileo-camel-motor",
  ["1", "2"])

testDivergentLogs(
  "convergent-logs-20170117-test3-set",
  "logs/logs-20170117-test3",
  "log-20170117-test3",
  ["galileo-camel-motor", "village-august-immune"])

testDivergentLogs(
  "convergent-logs-20170117-test4-set",
  "logs/logs-20170117-test4",
  "log-20170117-test4",
  ["nobel-letter-neutral", "telex-lobby-sweet"])

testDivergentLogs(
  "convergent-logs-20170117-test5-set",
  "logs/logs-20170117-test5",
  "log-20170117-test5",
  ["banana-oxygen-pilgrim", "epoxy-tango-engine", "jasmine-bravo-vital"])

testDivergentLogs(
  "divergent-logs-ct20171019-set",
  "logs/logs-ct20171019",
  "log-ct20171019",
  ["join-iris-berlin", "ocean-button-contour"])

testDivergentLogs(
  "divergent-logs-quT-set",
  "logs/logs-quTF5eAc",
  "log-quTF5eAc",
  ["harbor-royal-explain", "number-speed-metal", "prelude-chris-tourist"])

testDivergentLogs(
  "divergent-logs-rXF-set-1",
  "logs/logs-rXFbhTf8Ct",
  "log-rXFbhTf8Ct",
  ["original-log", "incorrect-operations-order"])

testDivergentLogs(
  "divergent-logs-rXF-set-2",
  "logs/logs-rXFbhTf8Ct",
  "log-rXFbhTf8Ct",
  ["original-log", "additional-operations"])
