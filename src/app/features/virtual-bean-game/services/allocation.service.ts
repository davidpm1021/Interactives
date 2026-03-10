import { Injectable } from '@angular/core';
import {
  type Allocations,
  type AllocationDiff,
  type CategoryConfig,
  type CategoryOption,
  type DependencyRule,
  type SubCategoryConfig,
  type ValidationResult,
} from '../models/game.models';

interface OptionLookup {
  option: CategoryOption;
  category: CategoryConfig;
  subCategory: SubCategoryConfig | null;
}

@Injectable({ providedIn: 'root' })
export class AllocationService {
  /** Calculate total beans allocated across all categories */
  calculateTotalBeans(allocations: Allocations, categories: readonly CategoryConfig[]): number {
    let total = 0;
    for (const key of this.getAllSlotKeys(categories)) {
      const selectedId = allocations[key];
      if (typeof selectedId === 'string' && selectedId) {
        const option = this.getOptionById(selectedId, categories);
        if (option) {
          total += option.option.beans;
        }
      }
    }
    return total;
  }

  /** Get beans remaining within budget */
  getBeansRemaining(
    allocations: Allocations,
    budget: number,
    categories: readonly CategoryConfig[],
  ): number {
    return budget - this.calculateTotalBeans(allocations, categories);
  }

  /** Full validation of current allocation against budget and rules */
  validateAllocation(
    allocations: Allocations,
    budget: number,
    categories: readonly CategoryConfig[],
  ): ValidationResult {
    const totalBeans = this.calculateTotalBeans(allocations, categories);
    const budgetRemaining = budget - totalBeans;
    const missingRequired = this.getMissingRequired(allocations, categories);
    const dependencyConflicts = this.getDependencyConflicts(allocations, categories);

    return {
      valid: budgetRemaining >= 0 && missingRequired.length === 0 && dependencyConflicts.length === 0,
      totalBeans,
      budgetRemaining,
      overBudget: budgetRemaining < 0,
      missingRequired,
      dependencyConflicts,
    };
  }

  /** Get list of required categories/sub-categories that haven't been selected */
  private getMissingRequired(
    allocations: Allocations,
    categories: readonly CategoryConfig[],
  ): readonly string[] {
    const missing: string[] = [];

    for (const cat of categories) {
      if (!cat.required) continue;

      if (cat.subCategories) {
        for (const sub of cat.subCategories) {
          if (!allocations[sub.id]) {
            missing.push(sub.id);
          }
        }
      } else if (cat.options) {
        if (!allocations[cat.id]) {
          missing.push(cat.id);
        }
      }
    }

    return missing;
  }

  /** Check for dependency rule violations. Returns messages for each conflict. */
  getDependencyConflicts(
    allocations: Allocations,
    categories: readonly CategoryConfig[],
  ): readonly string[] {
    const conflicts: string[] = [];

    for (const cat of categories) {
      if (cat.dependencies) {
        this.checkDependencies(cat.dependencies, cat.id, allocations, categories, conflicts);
      }
      if (cat.subCategories) {
        for (const sub of cat.subCategories) {
          if (sub.dependencies) {
            this.checkDependencies(sub.dependencies, sub.id, allocations, categories, conflicts);
          }
        }
      }
    }

    return conflicts;
  }

  private checkDependencies(
    rules: readonly DependencyRule[],
    slotId: string,
    allocations: Allocations,
    categories: readonly CategoryConfig[],
    conflicts: string[],
  ): void {
    for (const rule of rules) {
      const depSelected = this.getSelectedOptionForSlot(rule.dependsOnCategory, allocations, categories);
      if (!depSelected) continue;

      const depOptionId = depSelected.option.id;
      const currentSelected = allocations[slotId] as string | undefined;

      if (rule.effect === 'require' && depOptionId === rule.dependsOnOptionId) {
        // When the dependency has this option, this slot must be the first (0-bean) option
        const firstOption = this.getFirstOption(slotId, categories);
        if (currentSelected && firstOption && currentSelected !== firstOption.id) {
          conflicts.push(rule.message);
        }
      } else if (rule.effect === 'prohibit' && depOptionId === rule.dependsOnOptionId) {
        // When the dependency has this option, non-zero options are prohibited
        if (currentSelected) {
          const opt = this.getOptionById(currentSelected, categories);
          if (opt && opt.option.beans > 0) {
            conflicts.push(rule.message);
          }
        }
      }
    }
  }

  /**
   * Apply dependency cascades: auto-fix allocations based on dependency rules.
   * Returns a new allocations object with conflicts resolved.
   */
  applyDependencyCascade(
    allocations: Allocations,
    categories: readonly CategoryConfig[],
  ): Allocations {
    const result = { ...allocations };

    for (const cat of categories) {
      if (cat.subCategories) {
        for (const sub of cat.subCategories) {
          if (sub.dependencies) {
            this.cascadeSlot(sub.dependencies, sub.id, result, categories);
          }
        }
      }
      if (cat.dependencies) {
        this.cascadeSlot(cat.dependencies, cat.id, result, categories);
      }
    }

    return result;
  }

  private cascadeSlot(
    rules: readonly DependencyRule[],
    slotId: string,
    allocations: Allocations,
    categories: readonly CategoryConfig[],
  ): void {
    for (const rule of rules) {
      const depSelected = this.getSelectedOptionForSlot(rule.dependsOnCategory, allocations, categories);
      if (!depSelected) continue;

      const depOptionId = depSelected.option.id;

      if (depOptionId === rule.dependsOnOptionId) {
        const firstOption = this.getFirstOption(slotId, categories);
        if (firstOption) {
          const currentSelected = allocations[slotId] as string | undefined;
          if (rule.effect === 'require') {
            if (currentSelected !== firstOption.id) {
              allocations[slotId] = firstOption.id;
            }
          } else if (rule.effect === 'prohibit') {
            if (currentSelected) {
              const opt = this.getOptionById(currentSelected, categories);
              if (opt && opt.option.beans > 0) {
                allocations[slotId] = firstOption.id;
              }
            }
          }
        }
      }
    }
  }

  /**
   * Calculate the minimum beans required to satisfy all required categories
   * at their cheapest tier. This is the "hard floor" — events cannot push below this.
   */
  calculateMinRequiredBeans(categories: readonly CategoryConfig[]): number {
    let min = 0;

    for (const cat of categories) {
      if (!cat.required) continue;

      if (cat.subCategories) {
        for (const sub of cat.subCategories) {
          const cheapest = this.getCheapestOption(sub.options);
          if (cheapest) min += cheapest.beans;
        }
      } else if (cat.options) {
        const cheapest = this.getCheapestOption(cat.options);
        if (cheapest) min += cheapest.beans;
      }
    }

    return min;
  }

  /**
   * Apply the hard floor to a bean penalty.
   * Returns the actual penalty that can be applied without going below the minimum.
   */
  applyHardFloor(penalty: number, currentBeans: number, minRequired: number): number {
    if (penalty >= 0) return penalty; // advantages are not floored
    const maxLoss = Math.min(0, minRequired - currentBeans); // already below? no loss
    const affordable = currentBeans - minRequired;
    if (affordable <= 0) return 0;
    return Math.max(penalty, -affordable);
  }

  /** Generate diff between two allocation snapshots */
  getAllocationDiff(
    previous: Allocations,
    current: Allocations,
    categories: readonly CategoryConfig[],
  ): readonly AllocationDiff[] {
    const diffs: AllocationDiff[] = [];

    for (const cat of categories) {
      if (cat.subCategories) {
        for (const sub of cat.subCategories) {
          diffs.push(this.diffSlot(sub.id, previous, current, categories, cat, sub));
        }
      } else if (cat.options) {
        diffs.push(this.diffSlot(cat.id, previous, current, categories, cat, null));
      }
    }

    return diffs;
  }

  private diffSlot(
    slotId: string,
    previous: Allocations,
    current: Allocations,
    categories: readonly CategoryConfig[],
    category: CategoryConfig,
    subCategory: SubCategoryConfig | null,
  ): AllocationDiff {
    const prevId = (previous[slotId] as string) || null;
    const currId = (current[slotId] as string) || null;

    const prevOpt = prevId ? this.getOptionById(prevId, categories) : null;
    const currOpt = currId ? this.getOptionById(currId, categories) : null;

    const prevBeans = prevOpt?.option.beans ?? 0;
    const currBeans = currOpt?.option.beans ?? 0;
    const delta = currBeans - prevBeans;

    let changeType: AllocationDiff['changeType'];
    if (prevId === currId) {
      changeType = 'unchanged';
    } else if (!prevId && currId) {
      changeType = 'added';
    } else if (prevId && (!currId || currBeans === 0)) {
      changeType = 'dropped';
    } else if (delta > 0) {
      changeType = 'upgraded';
    } else {
      changeType = 'downgraded';
    }

    const diff: AllocationDiff = {
      categoryId: category.id,
      categoryName: category.name,
      previousOptionId: prevId,
      previousLabel: prevOpt?.option.label ?? '—',
      previousBeans: prevBeans,
      currentOptionId: currId,
      currentLabel: currOpt?.option.label ?? '—',
      currentBeans: currBeans,
      beanDelta: delta,
      changeType,
    };

    if (subCategory) {
      return { ...diff, subCategoryId: subCategory.id, subCategoryName: subCategory.name };
    }

    return diff;
  }

  /** Find an option by its ID across all categories and sub-categories */
  getOptionById(optionId: string, categories: readonly CategoryConfig[]): OptionLookup | null {
    for (const cat of categories) {
      if (cat.options) {
        const opt = cat.options.find((o) => o.id === optionId);
        if (opt) return { option: opt, category: cat, subCategory: null };
      }
      if (cat.subCategories) {
        for (const sub of cat.subCategories) {
          const opt = sub.options.find((o) => o.id === optionId);
          if (opt) return { option: opt, category: cat, subCategory: sub };
        }
      }
    }
    return null;
  }

  /** Find which category/sub-category an option belongs to */
  getCategoryForOption(
    optionId: string,
    categories: readonly CategoryConfig[],
  ): { category: CategoryConfig; subCategory: SubCategoryConfig | null } | null {
    const lookup = this.getOptionById(optionId, categories);
    if (!lookup) return null;
    return { category: lookup.category, subCategory: lookup.subCategory };
  }

  /** Get all allocation slot keys (category IDs or sub-category IDs) */
  private getAllSlotKeys(categories: readonly CategoryConfig[]): string[] {
    const keys: string[] = [];
    for (const cat of categories) {
      if (cat.subCategories) {
        for (const sub of cat.subCategories) {
          keys.push(sub.id);
        }
      } else if (cat.options) {
        keys.push(cat.id);
      }
    }
    return keys;
  }

  /** Get the selected option for a given slot (category or sub-category) */
  private getSelectedOptionForSlot(
    slotId: string,
    allocations: Allocations,
    categories: readonly CategoryConfig[],
  ): OptionLookup | null {
    // First check if slotId is a direct category with options
    const cat = categories.find((c) => c.id === slotId);
    if (cat?.options) {
      const selectedId = allocations[slotId] as string | undefined;
      if (selectedId) return this.getOptionById(selectedId, categories);
      return null;
    }

    // Check sub-categories
    for (const c of categories) {
      if (c.subCategories) {
        const sub = c.subCategories.find((s) => s.id === slotId);
        if (sub) {
          const selectedId = allocations[slotId] as string | undefined;
          if (selectedId) return this.getOptionById(selectedId, categories);
          return null;
        }
      }
    }

    return null;
  }

  /** Get the first (cheapest) option for a slot */
  private getFirstOption(
    slotId: string,
    categories: readonly CategoryConfig[],
  ): CategoryOption | null {
    for (const cat of categories) {
      if (cat.id === slotId && cat.options) {
        return cat.options[0] ?? null;
      }
      if (cat.subCategories) {
        for (const sub of cat.subCategories) {
          if (sub.id === slotId) {
            return sub.options[0] ?? null;
          }
        }
      }
    }
    return null;
  }

  private getCheapestOption(options: readonly CategoryOption[]): CategoryOption | null {
    if (options.length === 0) return null;
    return options.reduce((min, o) => (o.beans < min.beans ? o : min), options[0]);
  }
}
