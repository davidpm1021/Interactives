import { Injectable } from '@angular/core';
import { StockPick, StockReport } from '../models/stock-tracker.models';
import { formatCurrency, formatPercent } from './format.utils';

@Injectable()
export class ExportService {
  /** Trigger browser print */
  printReport(): void {
    window.print();
  }

  /** Copy written responses as formatted text to clipboard */
  async copyReportText(report: StockReport, picks: StockPick[]): Promise<boolean> {
    const lines = [
      '5 Stocks on Your Birthday - Investment Report',
      '',
      'STOCKS ANALYZED:',
      ...picks.map(p => `  ${p.companyName} (${p.ticker}) - ROI: ${formatPercent(p.roi)} | Current Value: ${formatCurrency(p.currentValue)}`),
      '',
      'BEST PERFORMER ANALYSIS:',
      report.bestPerformerAnalysis || '(not completed)',
      '',
      'MOST VALUABLE STOCK:',
      report.mostValuableAnalysis || '(not completed)',
      '',
      'BIGGEST SURPRISE:',
      report.biggestSurprise || '(not completed)',
      '',
      'LESSONS LEARNED:',
      report.lessonsLearned || '(not completed)',
    ];

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      return true;
    } catch {
      return false;
    }
  }

  /** Download a Chart.js chart as PNG */
  downloadChartAsImage(canvas: HTMLCanvasElement, filename: string): void {
    const url = canvas.toDataURL('image/png');
    this.triggerDownload(url, filename);
  }

  /** Download an HTML element as PNG using html2canvas */
  async downloadTableAsImage(element: HTMLElement, filename: string): Promise<void> {
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false,
    });
    const url = canvas.toDataURL('image/png');
    this.triggerDownload(url, filename);
  }

  private triggerDownload(dataUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
