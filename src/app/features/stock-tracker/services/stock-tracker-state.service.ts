import { Injectable, signal, computed } from '@angular/core';
import {
  StepId,
  StepConfig,
  StepStatus,
  STEPS,
  StudentProfile,
  StockPick,
  StockReport,
} from '../models/stock-tracker.models';

@Injectable()
export class StockTrackerStateService {
  // ── Core state ──
  readonly currentStep = signal<StepId>('setup');
  readonly profile = signal<StudentProfile | null>(null);
  readonly picks = signal<StockPick[]>([]);
  readonly report = signal<StockReport>({
    bestPerformerAnalysis: '',
    mostValuableAnalysis: '',
    biggestSurprise: '',
    lessonsLearned: '',
    generatedAt: new Date(),
  });
  readonly isLoading = signal(false);

  private readonly completedSteps = signal<Set<StepId>>(new Set());

  // ── Computed ──

  readonly allPicksComplete = computed(() => this.picks().length === 5);

  readonly allDataLoaded = computed(() =>
    this.picks().length === 5 && this.picks().every(p => p.annualData.length > 0)
  );

  readonly steps = computed<(StepConfig & { status: StepStatus })[]>(() => {
    const current = this.currentStep();
    const completed = this.completedSteps();
    return STEPS.map(step => ({
      ...step,
      status: this.getStepStatus(step.id, current, completed),
    }));
  });

  readonly currentStepConfig = computed(() =>
    STEPS.find(s => s.id === this.currentStep())!
  );

  readonly canAdvance = computed(() => {
    const step = this.currentStep();
    switch (step) {
      case 'setup':
        return this.profile() !== null && this.allPicksComplete();
      case 'track':
        return this.allDataLoaded();
      case 'compare':
        return true;
      case 'report':
        return false; // Last step
    }
  });

  // ── Navigation ──

  goToStep(stepId: StepId): void {
    const target = STEPS.find(s => s.id === stepId);
    if (!target) return;

    // Allow navigating to completed steps or the current step
    if (this.completedSteps().has(stepId) || stepId === this.currentStep()) {
      this.currentStep.set(stepId);
      return;
    }

    // Allow advancing to the next step if current step can advance
    if (this.canAdvance() && this.getNextStepId() === stepId) {
      this.advanceStep();
    }
  }

  advanceStep(): void {
    if (!this.canAdvance()) return;

    const current = this.currentStep();
    const nextId = this.getNextStepId();
    if (!nextId) return;

    // Mark current step as completed
    this.completedSteps.update(set => {
      const next = new Set(set);
      next.add(current);
      return next;
    });

    this.currentStep.set(nextId);
  }

  // ── Data mutations ──

  setProfile(profile: StudentProfile): void {
    this.profile.set(profile);
    // Invalidate downstream if profile changes
    this.invalidateFrom('track');
  }

  addPick(pick: StockPick): void {
    if (this.picks().length >= 5) return;
    if (this.picks().some(p => p.ticker === pick.ticker)) return;
    this.picks.update(picks => [...picks, pick]);
  }

  removePick(ticker: string): void {
    this.picks.update(picks => picks.filter(p => p.ticker !== ticker));
    this.invalidateFrom('track');
  }

  replacePick(oldTicker: string, newPick: StockPick): void {
    this.picks.update(picks =>
      picks.map(p => (p.ticker === oldTicker ? newPick : p))
    );
    this.invalidateFrom('track');
  }

  updatePickData(ticker: string, annualData: StockPick['annualData'], currentPrice: number): void {
    this.picks.update(picks =>
      picks.map(p => {
        if (p.ticker !== ticker) return p;
        const currentValue = currentPrice * p.sharesOwned;
        const roi = ((currentPrice - p.priceOnBirthday) / p.priceOnBirthday) * 100;
        const totalReturn = currentValue - p.priceOnBirthday * p.sharesOwned;
        return { ...p, annualData, currentPrice, currentValue, roi, totalReturn };
      })
    );
  }

  updateReport(partial: Partial<StockReport>): void {
    this.report.update(r => ({ ...r, ...partial }));
  }

  reset(): void {
    this.currentStep.set('setup');
    this.profile.set(null);
    this.picks.set([]);
    this.report.set({
      bestPerformerAnalysis: '',
      mostValuableAnalysis: '',
      biggestSurprise: '',
      lessonsLearned: '',
      generatedAt: new Date(),
    });
    this.isLoading.set(false);
    this.completedSteps.set(new Set());
  }

  // ── Helpers ──

  private getStepStatus(stepId: StepId, current: StepId, completed: Set<StepId>): StepStatus {
    if (stepId === current) return 'active';
    if (completed.has(stepId)) return 'completed';
    return 'locked';
  }

  private getNextStepId(): StepId | null {
    const currentIndex = STEPS.findIndex(s => s.id === this.currentStep());
    if (currentIndex < 0 || currentIndex >= STEPS.length - 1) return null;
    return STEPS[currentIndex + 1].id;
  }

  private invalidateFrom(stepId: StepId): void {
    const index = STEPS.findIndex(s => s.id === stepId);
    if (index < 0) return;

    this.completedSteps.update(set => {
      const next = new Set(set);
      for (let i = index; i < STEPS.length; i++) {
        next.delete(STEPS[i].id);
      }
      return next;
    });
  }
}
