/** Convenience type for doing constructor type matching with `instanceof`.
 */
export type Constructor<T> = new (...args: any[]) => T;
