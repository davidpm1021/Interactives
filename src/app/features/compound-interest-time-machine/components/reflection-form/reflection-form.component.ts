import { Component, inject } from '@angular/core';
import { ChallengeStateService } from '../../services/challenge-state.service';

interface ReflectionField {
  id: string;
  prompt: string;
}

/**
 * Three short-answer prompts on the Your Results screen. Autosaves each
 * textarea to the ChallengeStateService on blur so the print output and any
 * subsequent Back navigation preserve the student's writing.
 */
@Component({
  selector: 'app-reflection-form',
  standalone: true,
  imports: [],
  templateUrl: './reflection-form.component.html',
  styleUrl: './reflection-form.component.scss',
})
export class ReflectionFormComponent {
  private readonly stateService = inject(ChallengeStateService);

  protected readonly fields: readonly ReflectionField[] = [
    {
      id: 'summary-remember',
      prompt: 'One thing I want to remember about how compound growth works:',
    },
    {
      id: 'summary-action',
      prompt: 'One thing I could do this year to start using compound growth for myself:',
    },
    {
      id: 'summary-question',
      prompt: 'One question I still have:',
    },
  ];

  protected readonly reflections = this.stateService.reflections;

  protected onInput(id: string, event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    this.stateService.saveReflection(id, el.value);
  }
}
