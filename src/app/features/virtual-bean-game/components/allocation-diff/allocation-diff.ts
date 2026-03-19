import { Component, computed, input } from '@angular/core';
import { type AllocationDiff as AllocationDiffModel } from '../../models/game.models';

@Component({
  selector: 'app-allocation-diff',
  standalone: true,
  templateUrl: './allocation-diff.html',
  styleUrl: './allocation-diff.scss',
})
export class AllocationDiffComponent {
  readonly diffs = input.required<readonly AllocationDiffModel[]>();
  readonly title = input('What Changed');

  protected readonly summaryText = computed(() => {
    const d = this.diffs();
    const changed = d.filter((item) => item.changeType !== 'unchanged');
    if (changed.length === 0) return '';
    const totalFreed = changed.reduce((sum, item) => {
      if (item.beanDelta < 0) return sum + Math.abs(item.beanDelta);
      return sum;
    }, 0);
    if (totalFreed > 0) {
      return `You freed up ${totalFreed} bean${totalFreed !== 1 ? 's' : ''} by changing ${changed.length} categor${changed.length !== 1 ? 'ies' : 'y'}.`;
    }
    return `You changed ${changed.length} categor${changed.length !== 1 ? 'ies' : 'y'}.`;
  });

  protected getIcon(changeType: AllocationDiffModel['changeType']): string {
    switch (changeType) {
      case 'upgraded': return '▲';
      case 'downgraded': return '▼';
      case 'dropped': return '✕';
      case 'added': return '+';
      case 'unchanged': return '—';
    }
  }

  protected getLabel(diff: AllocationDiffModel): string {
    return diff.subCategoryName ?? diff.categoryName;
  }

  protected getScreenReaderText(diff: AllocationDiffModel): string {
    const label = this.getLabel(diff);
    switch (diff.changeType) {
      case 'upgraded':
        return `${label} upgraded from ${diff.previousLabel} to ${diff.currentLabel}, adding ${diff.beanDelta} bean${diff.beanDelta !== 1 ? 's' : ''}`;
      case 'downgraded':
        return `${label} downgraded from ${diff.previousLabel} to ${diff.currentLabel}, saving ${Math.abs(diff.beanDelta)} bean${Math.abs(diff.beanDelta) !== 1 ? 's' : ''}`;
      case 'dropped':
        return `${label} dropped, saving ${Math.abs(diff.beanDelta)} bean${Math.abs(diff.beanDelta) !== 1 ? 's' : ''}`;
      case 'added':
        return `${label} added: ${diff.currentLabel} for ${diff.currentBeans} bean${diff.currentBeans !== 1 ? 's' : ''}`;
      case 'unchanged':
        return `${label} unchanged at ${diff.currentLabel}`;
    }
  }
}
