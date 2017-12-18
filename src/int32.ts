
export const INT32_BOTTOM = - 0x7fffffff - 1
export const INT32_TOP = 0x7fffffff

/**
 * @param n
 * @return Is `n' an int32?
 */
export function isInt32 (n: number): boolean {
    return Number.isSafeInteger(n) && INT32_BOTTOM <= n && n <= INT32_TOP
}
