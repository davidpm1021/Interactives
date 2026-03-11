import { Component, input, output, signal, computed } from '@angular/core';
import { LoanInputs } from '../../models/amortization.models';
import { parseLoanAmount, formatLoanAmountDisplay } from '../../utils/formatters';

@Component({
  selector: 'app-loan-form',
  standalone: true,
  templateUrl: './loan-form.html',
  styleUrl: './loan-form.scss',
})
export class LoanForm {
  readonly isFormVisible = input(true);
  readonly isCalculating = input(false);
  readonly hasError = input(false);
  readonly errorMessage = input('');

  readonly calculate = output<LoanInputs>();
  readonly toggleForm = output<void>();

  protected readonly loanAmountDisplay = signal('');
  protected readonly interestRate = signal<number | null>(null);
  protected readonly loanTerm = signal<number | null>(null);
  protected readonly monthlyExtra = signal<number | null>(null);
  protected readonly oneTimeExtra = signal<number | null>(null);
  protected readonly oneTimeMonth = signal<number | null>(null);

  protected readonly showOneTimeMonth = computed(() => {
    const val = this.oneTimeExtra();
    return val !== null && val > 0;
  });

  protected readonly maxMonth = computed(() => {
    const term = this.loanTerm();
    return term && term > 0 ? term * 12 : 12;
  });

  protected onLoanAmountInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value;
    const numeric = parseLoanAmount(raw);
    this.loanAmountDisplay.set(numeric > 0 ? formatLoanAmountDisplay(numeric) : raw);
  }

  protected onSubmit(): void {
    const loanAmount = parseLoanAmount(this.loanAmountDisplay());

    this.calculate.emit({
      loanAmount,
      annualInterestRate: this.interestRate() ?? 0,
      loanTermYears: this.loanTerm() ?? 0,
      monthlyExtraPayment: this.monthlyExtra() ?? 0,
      oneTimeExtraPayment: this.oneTimeExtra() ?? 0,
      oneTimeExtraPaymentMonth: this.oneTimeMonth() ?? 1,
    });
  }

  protected onToggle(): void {
    this.toggleForm.emit();
  }
}
