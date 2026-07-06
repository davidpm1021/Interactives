import { WritableSignal } from '@angular/core';

/**
 * Wraps a signal of T[] with the "edit the first item, leave the rest" pattern
 * used by every template-builder editor. The form binds to docs[0] and form
 * changes mutate only that first slot; the rest of the array (extra docs from
 * batch generation) stay untouched.
 *
 * Each editor previously hand-rolled this pattern as a private `mutateFirst`
 * method. Now they all delegate here.
 */
export class FirstItemMutator<T> {
  constructor(
    private readonly signal: WritableSignal<T[]>,
    private readonly fallback: () => T,
  ) {}

  /**
   * Apply `transform` to the first item of the array. If the array is empty,
   * the fallback factory is used to seed it.
   */
  mutate(transform: (item: T) => T): void {
    this.signal.update((arr) => {
      if (arr.length === 0) return [transform(this.fallback())];
      return [transform(arr[0]), ...arr.slice(1)];
    });
  }
}
