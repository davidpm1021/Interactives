import { Component, OnDestroy, computed, input, output, signal } from '@angular/core';
import { FillSentence, TAKEAWAY_DISTRACTORS, TAKEAWAY_SENTENCES } from '../../data/takeaways-fill';

interface Chip {
  id: string;
  text: string;
  /** True when this chip is currently placed in a blank. */
  placed: boolean;
  /** True once the placement is locked in, which happens on a correct answer. */
  locked: boolean;
}

interface BlankState {
  blankId: string;
  answer: string;
  /** Chip id currently occupying the slot, if any. */
  chipId: string | null;
  /** True when the placed chip matches the answer. */
  correct: boolean;
  /** Set briefly after a wrong placement to trigger the shake animation. */
  shake: boolean;
}

/**
 * Click-to-place fill-in-the-blank for Key Takeaways. Students click a chip
 * to select it, then click a blank to drop it. Correct → green lock; wrong →
 * red shake + chip returns to bank. Fully keyboard-accessible.
 *
 * There is deliberately no "Show answers" escape hatch. Review: "I already
 * know my answers are correct from the green box, check mark, and locking
 * into place" and "are we okay that they can just click show answers without
 * trying?" The bank is a closed set with four distractors and wrong chips
 * bounce straight back, so nobody can get stuck.
 */
@Component({
  selector: 'app-takeaways-fill',
  standalone: true,
  imports: [],
  templateUrl: './takeaways-fill.component.html',
  styleUrl: './takeaways-fill.component.scss',
})
export class TakeawaysFillComponent implements OnDestroy {
  readonly sentences = input<readonly FillSentence[]>(TAKEAWAY_SENTENCES);
  readonly distractors = input<readonly string[]>(TAKEAWAY_DISTRACTORS);
  readonly completedChange = output<boolean>();

  protected readonly selectedChipId = signal<string | null>(null);
  protected readonly announcement = signal('');

  /** In-flight shake-unplace timers, keyed by blank id. */
  private readonly pendingShakes = new Map<string, ReturnType<typeof setTimeout>>();

  /** Deterministic-ish shuffled order for the word bank based on the token list. */
  private readonly chipOrder = computed<string[]>(() => {
    const answers = this.sentences().flatMap((s) =>
      s.parts.filter((p) => p.blankId).map((p) => p.answer ?? ''),
    );
    const all = [...answers, ...this.distractors()];
    // Simple stable shuffle: alphabetical (case-insensitive) then reverse — good
    // enough that answer order isn't the same as sentence order, without needing
    // Math.random (which is blocked in some environments).
    return [...all].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  });

  protected readonly chips = signal<Chip[]>([]);
  protected readonly blanks = signal<Record<string, BlankState>>({});

  constructor() {
    // Initialize once from inputs. If inputs change (rare), re-init.
    this.reset();
  }

  private reset(): void {
    const chipList: Chip[] = this.chipOrder().map((text, i) => ({
      id: `chip-${i}-${text}`,
      text,
      placed: false,
      locked: false,
    }));
    this.chips.set(chipList);

    const blankMap: Record<string, BlankState> = {};
    for (const s of this.sentences()) {
      for (const p of s.parts) {
        if (p.blankId && p.answer) {
          blankMap[p.blankId] = {
            blankId: p.blankId,
            answer: p.answer,
            chipId: null,
            correct: false,
            shake: false,
          };
        }
      }
    }
    this.blanks.set(blankMap);
    this.selectedChipId.set(null);
  }

  protected chipDisplay(chip: Chip): string {
    return chip.text;
  }

  protected onChipClick(chip: Chip): void {
    if (chip.placed && chip.locked) return; // locked chips can't be moved
    if (chip.placed && !chip.locked) {
      // Unplace: return the chip to the bank and clear its blank.
      const blanks = { ...this.blanks() };
      for (const b of Object.values(blanks)) {
        if (b.chipId === chip.id) {
          blanks[b.blankId] = { ...b, chipId: null, correct: false, shake: false };
        }
      }
      this.blanks.set(blanks);
      this.chips.update((cs) => cs.map((c) => (c.id === chip.id ? { ...c, placed: false } : c)));
      this.selectedChipId.set(null);
      return;
    }
    // Toggle selection
    this.selectedChipId.update((cur) => (cur === chip.id ? null : chip.id));
  }

  protected onBlankClick(blankId: string): void {
    const blank = this.blanks()[blankId];
    if (blank.correct) return; // locked

    // If blank is filled but wrong, unplace before accepting a new chip.
    if (blank.chipId) {
      const oldChipId = blank.chipId;
      this.blanks.update((bs) => ({ ...bs, [blankId]: { ...bs[blankId], chipId: null, correct: false } }));
      this.chips.update((cs) => cs.map((c) => (c.id === oldChipId ? { ...c, placed: false } : c)));
      return;
    }

    const chipId = this.selectedChipId();
    if (!chipId) return;
    const chip = this.chips().find((c) => c.id === chipId);
    if (!chip || chip.placed) return;

    const isCorrect = chip.text.toLowerCase() === blank.answer.toLowerCase();
    if (isCorrect) {
      this.blanks.update((bs) => ({
        ...bs,
        [blankId]: { ...bs[blankId], chipId, correct: true, shake: false },
      }));
      this.chips.update((cs) => cs.map((c) => (c.id === chipId ? { ...c, placed: true, locked: true } : c)));
      this.selectedChipId.set(null);
      this.announcement.set(`"${chip.text}" is correct.`);
      this.maybeEmitCompleted();
    } else {
      // Shake, then unplace
      this.blanks.update((bs) => ({
        ...bs,
        [blankId]: { ...bs[blankId], chipId, shake: true },
      }));
      this.chips.update((cs) => cs.map((c) => (c.id === chipId ? { ...c, placed: true } : c)));
      this.announcement.set(`"${chip.text}" isn't right for that blank. Try another.`);
      // Return the chip after a short delay so the shake is visible. The timer
      // is tracked so it can be cancelled on destroy, and the callback
      // re-checks that the blank is still holding this chip in a shaking state
      // before clearing it.
      const timer = setTimeout(() => {
        this.pendingShakes.delete(blankId);
        this.unplaceShake(blankId, chipId);
      }, 500);
      this.pendingShakes.set(blankId, timer);
    }
  }

  /**
   * Return a wrongly-placed chip to the bank.
   *
   * Guarded: if the student cleared the blank and landed a correct chip before
   * the timer fired, leave it alone. Without this check a stale timer could
   * blank a slot that had already been marked correct, permanently rendering
   * it as an empty box with a green check that no further interaction could
   * repair.
   */
  private unplaceShake(blankId: string, chipId: string): void {
    const blank = this.blanks()[blankId];
    if (!blank || blank.chipId !== chipId || blank.correct) return;

    this.blanks.update((bs) => ({
      ...bs,
      [blankId]: { ...bs[blankId], chipId: null, shake: false },
    }));
    this.chips.update((cs) => cs.map((c) => (c.id === chipId ? { ...c, placed: false } : c)));
    if (this.selectedChipId() === chipId) this.selectedChipId.set(null);
  }

  ngOnDestroy(): void {
    for (const timer of this.pendingShakes.values()) clearTimeout(timer);
    this.pendingShakes.clear();
  }

  protected onKeyChip(event: KeyboardEvent, chip: Chip): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onChipClick(chip);
    }
  }

  protected onKeyBlank(event: KeyboardEvent, blankId: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onBlankClick(blankId);
    }
  }

  protected chipInBlank(blankId: string): Chip | null {
    const b = this.blanks()[blankId];
    if (!b?.chipId) return null;
    return this.chips().find((c) => c.id === b.chipId) ?? null;
  }

  private maybeEmitCompleted(): void {
    const allDone = Object.values(this.blanks()).every((b) => b.correct);
    if (allDone) this.completedChange.emit(true);
  }
}
