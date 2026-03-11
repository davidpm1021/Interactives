export interface LoanInputs {
  loanAmount: number;
  annualInterestRate: number;
  loanTermYears: number;
  monthlyExtraPayment: number;
  oneTimeExtraPayment: number;
  oneTimeExtraPaymentMonth: number;
}

export interface Payment {
  paymentNumber: number;
  paymentAmount: number;
  principal: number;
  interest: number;
  extraPayment: number | undefined;
  totalPayment: number;
  remainingBalance: number;
}

export interface LoanSummary {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  monthsToPayoff: number;
  totalSaved: number;
}
