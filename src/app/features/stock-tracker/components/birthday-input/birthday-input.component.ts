import { Component, output, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StudentProfile } from '../../models/stock-tracker.models';
import { CalculationService } from '../../services/calculation.service';
import { formatDate } from '../../services/format.utils';

@Component({
  selector: 'app-birthday-input',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './birthday-input.component.html',
  styleUrl: './birthday-input.component.scss',
})
export class BirthdayInputComponent {
  readonly profileSet = output<StudentProfile>();

  protected readonly monthValue = signal('');
  protected readonly dayValue = signal('');
  protected readonly yearValue = signal('');
  protected readonly error = signal('');
  protected readonly tenthBirthdayDisplay = signal('');
  protected readonly confirmed = signal(false);

  private readonly calcService = inject(CalculationService);

  protected readonly months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Bounds for the birth-year field. Must be born on or before (today - 11 years)
  // for the 10th birthday to be at least a year in the past.
  private readonly today = new Date();
  protected readonly minBirthYear = 1970;
  protected readonly maxBirthYear = this.today.getFullYear() - 11;
  protected readonly maxBirthDateDisplay = this.formatMaxDate();

  private formatMaxDate(): string {
    const d = new Date(this.today);
    d.setFullYear(d.getFullYear() - 11);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  protected onFieldChange(): void {
    this.error.set('');
    this.tenthBirthdayDisplay.set('');
    this.confirmed.set(false);
  }

  protected onSubmit(): void {
    const month = parseInt(this.monthValue(), 10);
    const day = parseInt(this.dayValue(), 10);
    const year = parseInt(this.yearValue(), 10);

    if (isNaN(month) || isNaN(day) || isNaN(year)) {
      this.error.set('Please fill in all fields.');
      return;
    }

    if (day < 1 || day > 31) {
      this.error.set('Please enter a valid day (1-31).');
      return;
    }

    if (year < this.minBirthYear || year > this.maxBirthYear) {
      this.error.set(
        `Please enter the year you were born. It should be between ${this.minBirthYear} and ${this.maxBirthYear}.`,
      );
      return;
    }

    const birthday = new Date(year, month, day);

    // Validate the date is real (e.g., not Feb 30)
    if (birthday.getMonth() !== month || birthday.getDate() !== day) {
      this.error.set('That date doesn\'t exist. Please check the day.');
      return;
    }

    const tenthBirthday = this.calcService.calculateTenthBirthday(birthday);
    const now = new Date();

    // 10th birthday must be at least 1 year in the past
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (tenthBirthday > oneYearAgo) {
      this.error.set(
        `That would put your 10th birthday on ${tenthBirthday.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}, which isn't at least a year in the past. Please enter the year you were born. You'd need to be born on or before ${this.maxBirthDateDisplay}.`,
      );
      return;
    }

    // 10th birthday should be no earlier than ~1970
    if (tenthBirthday.getFullYear() < 1970) {
      this.error.set('Your 10th birthday is before 1970. Historical stock data isn\'t reliable that far back.');
      return;
    }

    const currentAge = this.calcService.calculateCurrentAge(birthday);

    this.tenthBirthdayDisplay.set(formatDate(tenthBirthday));
    this.confirmed.set(true);

    const profile: StudentProfile = {
      birthday,
      tenthBirthday,
      tradingDayOnTenth: tenthBirthday, // Will be refined when data is fetched
      currentAge,
    };

    this.profileSet.emit(profile);
  }
}
