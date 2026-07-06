import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Question } from '../../models/question.models';
import { QuestionItem } from '../question-item/question-item';

@Component({
  selector: 'app-question-stack',
  standalone: true,
  imports: [QuestionItem],
  templateUrl: './question-stack.html',
  styleUrl: './question-stack.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionStack {
  readonly questions = input.required<Question[]>();
}
