import { Component, input, output } from '@angular/core';
import { ChallengeResult } from '../../models/challenge.model';
import { ACTS, CHALLENGES, getChallengesByAct } from '../../data/challenges';

@Component({
  selector: 'app-hub-screen',
  standalone: true,
  templateUrl: './hub-screen.html',
  styleUrl: './hub-screen.scss',
})
export class HubScreen {
  readonly completedChallengeIds = input.required<ReadonlySet<string>>();
  readonly results = input.required<readonly ChallengeResult[]>();
  readonly selectChallenge = output<string>();

  protected readonly acts = ACTS;

  protected getChallengesForAct(actId: number) {
    return getChallengesByAct(actId);
  }

  protected isCompleted(challengeId: string): boolean {
    return this.completedChallengeIds().has(challengeId);
  }

  protected onTaskClick(challengeId: string): void {
    if (!this.isCompleted(challengeId)) {
      this.selectChallenge.emit(challengeId);
    }
  }

  protected get completedCount(): number {
    return this.completedChallengeIds().size;
  }

  protected get totalCount(): number {
    return CHALLENGES.length;
  }
}
