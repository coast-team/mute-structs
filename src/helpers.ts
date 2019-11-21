import {Ordering} from "./ordering"

export function findPredecessor<T> (list: T[], element: T, compareFn: (a: T, b: T) => Ordering): T | undefined {
    let l = 0
    let r = list.length
    while (l < r) {
        const m = Math.floor((l + r) / 2)
        const other = list[m]
        if (compareFn(other, element) === Ordering.Less) {
            l = m + 1
        } else {
            r = m
        }
    }
    return list[l - 1]
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
