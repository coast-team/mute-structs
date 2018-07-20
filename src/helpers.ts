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
