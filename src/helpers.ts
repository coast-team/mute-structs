import {Ordering} from "./ordering"

export function findPredecessor<T> (list: T[], element: T, compareFn: (a: T, b: T) => Ordering): T | undefined {
    let predecessor
    let isOk = true
    let i = 0
    while (isOk && i < list.length) {
        const other = list[i]
        if (compareFn(other, element) === Ordering.Less) {
            predecessor = other
            i++
        } else {
            isOk = false
        }
    }
    return predecessor
}

export function flatten<T> (acc: T[], current: T[]): T[] {
    return acc.concat(current)
}

/**
 * Check if an array is sorted
 *
 * @param {T[]} array The array to browse
 * @param {(a: T, b: T) => Ordering} compareFn The comparison function used to determine the order between two elements
 * @return {boolean} Is the array sorted
 */
export function isSorted<T> (array: T[], compareFn: (a: T, b: T) => Ordering): boolean {
    return array.every((value: T, index: number) => {
        if (index === 0) {
            return true
        }
        const other = array[index - 1]
        return compareFn(other, value) === Ordering.Less
    })
}
