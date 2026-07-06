import { Component, signal, output, HostListener } from '@angular/core';

interface FieldInfo {
  number: number;
  name: string;
  location: string;
  purpose: string;
  commonMistake: string;
}

@Component({
  selector: 'app-reference-panel',
  standalone: true,
  templateUrl: './reference-panel.component.html',
  styleUrl: './reference-panel.component.scss',
})
export class ReferencePanelComponent {
  readonly fieldSelected = output<string>();

  protected readonly isOpen = signal(false);
  protected readonly activeField = signal<number | null>(null);

  protected readonly fields: FieldInfo[] = [
    {
      number: 1,
      name: 'Date',
      location: 'Top right',
      purpose: 'Legal date of the check',
      commonMistake: 'Using wrong format, post-dating',
    },
    {
      number: 2,
      name: 'Payee ("Pay to the order of")',
      location: 'First long line',
      purpose: 'Who receives the money',
      commonMistake: 'Misspelling the payee\'s name',
    },
    {
      number: 3,
      name: 'Numeric Amount',
      location: 'Box right of payee',
      purpose: 'Dollar amount in numbers',
      commonMistake: 'Forgetting cents, no decimal',
    },
    {
      number: 4,
      name: 'Written Amount',
      location: 'Line below payee',
      purpose: 'Dollar amount in words',
      commonMistake:
        'Not matching numeric, no "and XX/100", no line after',
    },
    {
      number: 5,
      name: 'Memo',
      location: 'Bottom left',
      purpose: 'What the payment is for',
      commonMistake:
        'Leaving blank when context matters (rent, tuition)',
    },
    {
      number: 6,
      name: 'Signature',
      location: 'Bottom right',
      purpose: 'Authorization',
      commonMistake: 'Forgetting to sign',
    },
    {
      number: 7,
      name: 'Check Number',
      location: 'Top right (pre-printed)',
      purpose: 'Tracking / reconciliation',
      commonMistake: '(Not editable)',
    },
    {
      number: 8,
      name: 'Routing Number',
      location: 'Bottom left (pre-printed)',
      purpose: 'Bank identification',
      commonMistake: '(Not editable)',
    },
    {
      number: 9,
      name: 'Account Number',
      location: 'Bottom center (pre-printed)',
      purpose: 'Account identification',
      commonMistake: '(Not editable)',
    },
  ];

  @HostListener('document:keydown.escape')
  protected onEscapeKey(): void {
    if (this.isOpen()) {
      this.close();
    }
  }

  protected onBadgeKeydown(event: KeyboardEvent, num: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectField(num);
    }
  }

  protected toggle(): void {
    this.isOpen.update((open) => !open);
    if (!this.isOpen()) {
      this.activeField.set(null);
    }
  }

  protected close(): void {
    this.isOpen.set(false);
    this.activeField.set(null);
  }

  protected selectField(num: number): void {
    this.activeField.set(this.activeField() === num ? null : num);
  }
}
