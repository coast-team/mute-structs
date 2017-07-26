/**
 * Equivalent to any but which does not bypass the compiler
 */
type SafeAny<T> = { [k in keyof T]?: SafeAny<T[k]> } | boolean | number | string | symbol | null | undefined
