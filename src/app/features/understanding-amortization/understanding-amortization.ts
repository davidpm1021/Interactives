import { Component, computed, signal } from '@angular/core';
import { TopHeader } from '../../shared/top-header/top-header';
import { LoanForm } from './components/loan-form/loan-form';
import { SummaryBar } from './components/summary-bar/summary-bar';
import { AmortizationTable } from './components/amortization-table/amortization-table';
import { LoanCharts } from './components/loan-charts/loan-charts';
import { AmortizationService } from './services/amortization.service';
import { LoanInputs, LoanSummary, Payment } from './models/amortization.models';
import { ScrollCueComponent } from '../../shared/scroll-cue/scroll-cue.component';

@Component({
  selector: 'app-understanding-amortization',
  standalone: true,
  imports: [TopHeader, LoanForm, SummaryBar, AmortizationTable, LoanCharts, ScrollCueComponent],
  providers: [AmortizationService],
  templateUrl: './understanding-amortization.html',
  styleUrl: './understanding-amortization.scss',
})
export class UnderstandingAmortization {
  protected readonly title = 'Loan Amortization Calculator';

  protected readonly amortizationSchedule = signal<Payment[]>([]);
  protected readonly loanSummary = signal<LoanSummary | null>(null);

  protected readonly isCalculating = signal(false);
  protected readonly hasError = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly isFormVisible = signal(true);
  protected readonly displayedRows = signal(24);

  protected readonly hasResults = computed(() => this.amortizationSchedule().length > 0);
  protected readonly visibleRows = computed(() =>
    this.amortizationSchedule().slice(0, this.displayedRows()),
  );
  protected readonly hasMoreRows = computed(
    () => this.displayedRows() < this.amortizationSchedule().length,
  );

  constructor(private readonly amortizationService: AmortizationService) {}

  protected onCalculate(inputs: LoanInputs): void {
    this.hasError.set(false);
    this.errorMessage.set('');

    const error = this.validate(inputs);
    if (error) {
      this.hasError.set(true);
      this.errorMessage.set(error);
      return;
    }

    this.isCalculating.set(true);

    // Use setTimeout to allow UI to show "Calculating..." state
    setTimeout(() => {
      const schedule = this.amortizationService.generateSchedule(inputs);
      const summary = this.amortizationService.calculateSummary(inputs, schedule);

      this.amortizationSchedule.set(schedule);
      this.loanSummary.set(summary);
      this.displayedRows.set(24);
      this.isCalculating.set(false);
      this.isFormVisible.set(false);
    }, 0);
  }

  protected onToggleForm(): void {
    this.isFormVisible.update((v) => !v);
  }

  protected onLoadMore(): void {
    this.displayedRows.update((v) => v + 24);
  }

  private validate(inputs: LoanInputs): string | null {
    if (!inputs.loanAmount || inputs.loanAmount <= 0) {
      return 'Please enter a positive loan amount';
    }
    if (inputs.annualInterestRate < 0) {
      return 'Please enter a positive interest rate';
    }
    if (
      !inputs.loanTermYears ||
      inputs.loanTermYears < 1 ||
      inputs.loanTermYears > 40
    ) {
      return 'Loan term must be between 1 and 40 years';
    }
    if (inputs.monthlyExtraPayment < 0) {
      return 'Monthly extra payment cannot be negative';
    }
    if (inputs.oneTimeExtraPayment < 0) {
      return 'One-time extra payment cannot be negative';
    }
    if (
      inputs.oneTimeExtraPayment > 0 &&
      (inputs.oneTimeExtraPaymentMonth < 1 ||
        inputs.oneTimeExtraPaymentMonth > inputs.loanTermYears * 12)
    ) {
      return 'One-time extra payment month must be within the loan term';
    }
    return null;
  }
}
