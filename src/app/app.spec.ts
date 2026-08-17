import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  // Was "should render title", asserting an <h1> reading "Hello, ngpf-interactives"
  // from the original Angular scaffold. That markup is long gone: the root
  // component renders a skip link and a router outlet, nothing else. The
  // assertion had been failing against a page that no longer exists, so it
  // now covers the one piece of markup App actually owns.
  it('renders a skip link targeting the page main content', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const skipLink = compiled.querySelector<HTMLAnchorElement>('a.skip-link');
    expect(skipLink?.textContent?.trim()).toBe('Skip to main content');
    expect(skipLink?.getAttribute('href')).toBe('#main-content');
  });
});
