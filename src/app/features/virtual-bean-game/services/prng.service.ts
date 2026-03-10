import { Injectable } from '@angular/core';

/** Seeded pseudo-random number generator using mulberry32 */
@Injectable({ providedIn: 'root' })
export class PrngService {
  /** Characters used for seed generation (no ambiguous chars like 0/O, 1/I/L) */
  private readonly SEED_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

  /** Create a deterministic PRNG function from a string seed */
  create(seed: string): () => number {
    let state = this.hashSeed(seed);
    return () => {
      state |= 0;
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Generate a random 4-character seed code */
  generateSeed(): string {
    const chars = this.SEED_CHARS;
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  /** Hash a string seed to a 32-bit integer */
  private hashSeed(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash + char) | 0;
    }
    return hash;
  }
}
