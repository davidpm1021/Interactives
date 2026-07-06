import { Injectable } from '@angular/core';
import { StockPick } from '../models/stock-tracker.models';

@Injectable()
export class CalculationService {
  /** ROI as a percentage: ((current - purchase) / purchase) * 100 */
  calculateROI(purchasePrice: number, currentPrice: number): number {
    if (purchasePrice === 0) return 0;
    return ((currentPrice - purchasePrice) / purchasePrice) * 100;
  }

  /** Total dollar return: (currentPrice - purchasePrice) * shares */
  calculateTotalReturn(purchasePrice: number, currentPrice: number, shares: number): number {
    return (currentPrice - purchasePrice) * shares;
  }

  /** Year-over-year percentage change */
  calculateYoYChange(previousPrice: number, currentPrice: number): number {
    if (previousPrice === 0) return 0;
    return ((currentPrice - previousPrice) / previousPrice) * 100;
  }

  /**
   * Find the nearest PRIOR trading day to the target date.
   * Timestamps are Unix seconds from Yahoo Finance.
   * Returns a Date for the closest timestamp <= target.
   */
  findNearestPriorTradingDay(targetDate: Date, availableTimestamps: number[]): Date {
    const targetUnix = Math.floor(targetDate.getTime() / 1000);
    let best = availableTimestamps[0];

    for (const ts of availableTimestamps) {
      if (ts <= targetUnix) {
        best = ts;
      } else {
        break; // timestamps are sorted ascending
      }
    }

    return new Date(best * 1000);
  }


  /** Calculate the student's 10th birthday from their birthday */
  calculateTenthBirthday(birthday: Date): Date {
    const tenth = new Date(birthday);
    tenth.setFullYear(tenth.getFullYear() + 10);
    return tenth;
  }

  /** Calculate current age from birthday */
  calculateCurrentAge(birthday: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const monthDiff = today.getMonth() - birthday.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
      age--;
    }
    return age;
  }
}
