import {
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  effect,
  inject,
  input,
} from '@angular/core';

/**
 * Scales an element via CSS `zoom` so its rendered height stays close to a target.
 * Used by template-builder editors to make 2-up previews fill the half-page slot
 * regardless of how much content the document carries.
 *
 * `zoom` is non-standard but supported in Chromium, Safari, and Firefox (since 126).
 * It affects both screen and print layout, so the print output mirrors what the
 * editor preview shows.
 */
@Directive({
  selector: '[appFitToHeight]',
  standalone: true,
})
export class FitToHeightDirective implements OnInit, OnDestroy {
  readonly target = input.required<number>({ alias: 'appFitToHeight' });
  readonly enabled = input(true, { alias: 'appFitToHeightEnabled' });
  readonly minZoom = input(0.5, { alias: 'appFitToHeightMinZoom' });
  readonly maxZoom = input(1.5, { alias: 'appFitToHeightMaxZoom' });

  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private mutationObserver: MutationObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private rafHandle: number | null = null;
  private readonly onWindowResize = () => this.scheduleFit();

  constructor() {
    effect(() => {
      this.enabled();
      this.target();
      this.scheduleFit();
    });
  }

  ngOnInit(): void {
    this.scheduleFit();
    this.mutationObserver = new MutationObserver(() => this.scheduleFit());
    this.mutationObserver.observe(this.elementRef.nativeElement, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    // Observe the host element itself so we react to layout-only reflows
    // (font swaps, sidebar collapses, etc.) that don't change body height.
    this.resizeObserver = new ResizeObserver(() => this.scheduleFit());
    this.resizeObserver.observe(this.elementRef.nativeElement);
    this.resizeObserver.observe(document.body);
    // Belt-and-suspenders: catch viewport width changes in browsers where the
    // body-height ResizeObserver doesn't fire.
    window.addEventListener('resize', this.onWindowResize);
  }

  ngOnDestroy(): void {
    this.mutationObserver?.disconnect();
    this.resizeObserver?.disconnect();
    window.removeEventListener('resize', this.onWindowResize);
    if (this.rafHandle !== null) cancelAnimationFrame(this.rafHandle);
  }

  private scheduleFit(): void {
    if (this.rafHandle !== null) cancelAnimationFrame(this.rafHandle);
    this.rafHandle = requestAnimationFrame(() => {
      this.rafHandle = null;
      this.fit();
    });
  }

  private fit(): void {
    const el = this.elementRef.nativeElement;
    const style = el.style as CSSStyleDeclaration & { zoom?: string };
    if (!this.enabled()) {
      style.zoom = '';
      return;
    }
    style.zoom = '1';
    const natural = el.offsetHeight;
    if (natural <= 0) return;
    const ratio = this.target() / natural;
    const zoom = Math.min(this.maxZoom(), Math.max(this.minZoom(), ratio));
    style.zoom = zoom.toFixed(3);
  }
}
