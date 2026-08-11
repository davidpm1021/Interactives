import {
  Component,
  ElementRef,
  HostListener,
  inject,
  signal,
  afterNextRender,
  Injector,
  OnDestroy,
} from '@angular/core';

/**
 * "More below" pill shown while the page has content past the fold.
 *
 * Several screens in this activity run taller than a laptop viewport, and on
 * the reveal screens the reflect card and its Next button sit entirely below
 * it, so the page reads as finished when it isn't. This is the general
 * affordance; the reflect card additionally pulls focus to itself when it
 * appears, which is what actually moves the student along.
 *
 * Deliberately a button rather than a gradient fade: a fade is easy to miss
 * and can't be acted on.
 *
 * Feature-local for now. If this earns its place it belongs in shared/, which
 * needs sign-off under the repo's isolation rules.
 */
@Component({
  selector: 'app-scroll-cue',
  standalone: true,
  imports: [],
  template: `
    @if (visible()) {
      <button
        type="button"
        class="scroll-cue"
        (click)="scrollDown()"
        aria-label="Scroll down for more"
      >
        <span class="scroll-cue__text">More below</span>
        <span class="scroll-cue__arrow" aria-hidden="true">&#8595;</span>
      </button>
    }
  `,
  styles: [`
    .scroll-cue {
      position: fixed;
      left: 50%;
      transform: translateX(-50%);
      bottom: var(--ngpf-spacing-md);
      z-index: 20;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.45rem 0.9rem;
      border: 1px solid var(--ngpf-light-gray-blue);
      border-radius: 999px;
      background: white;
      box-shadow: var(--ngpf-shadow-md);
      font-family: var(--ngpf-font-body);
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--ngpf-royal-blue);
      cursor: pointer;
      animation: scroll-cue-in 200ms ease-out;

      &:hover {
        background: var(--ngpf-ice-blue);
        border-color: var(--ngpf-royal-blue);
      }

      &:focus-visible {
        outline: 2px solid var(--ngpf-sky-blue);
        outline-offset: 2px;
      }
    }

    .scroll-cue__arrow {
      animation: scroll-cue-nudge 1.8s ease-in-out infinite;
    }

    @keyframes scroll-cue-in {
      from { opacity: 0; transform: translateX(-50%) translateY(6px); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0); }
    }

    @keyframes scroll-cue-nudge {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(3px); }
    }

    @media (prefers-reduced-motion: reduce) {
      .scroll-cue,
      .scroll-cue__arrow {
        animation: none;
      }
    }

    @media print {
      .scroll-cue { display: none; }
    }
  `],
})
export class ScrollCueComponent implements OnDestroy {
  /**
   * How much hidden content counts as worth pointing at.
   *
   * Generous on purpose. A screen whose controls all fit can still be a few
   * dozen pixels taller than the viewport from page padding alone; at a small
   * threshold the cue appeared on the predict screen for 32px of padding and
   * sat on top of the "← Back" button. This is roughly one control's height,
   * so the cue only shows when something real is below.
   */
  private static readonly SLACK = 80;

  protected readonly visible = signal(false);

  private readonly injector = inject(Injector);
  private readonly host = inject(ElementRef<HTMLElement>);
  private observer: MutationObserver | null = null;

  constructor() {
    afterNextRender(() => {
      this.update();
      // Phase changes swap whole screens in and out, which changes the page
      // height without any scroll or resize event firing.
      this.observer = new MutationObserver(() => this.update());
      const root = this.host.nativeElement.ownerDocument?.body;
      if (root) this.observer.observe(root, { childList: true, subtree: true });
    }, { injector: this.injector });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  protected update(): void {
    if (typeof window === 'undefined') return;
    const doc = document.documentElement;
    const remaining = doc.scrollHeight - window.scrollY - window.innerHeight;
    this.visible.set(remaining > ScrollCueComponent.SLACK);
  }

  protected scrollDown(): void {
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollBy({
      top: Math.round(window.innerHeight * 0.8),
      behavior: reduced ? 'auto' : 'smooth',
    });
  }
}
