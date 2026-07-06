import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-download-button',
  standalone: true,
  template: `
    <button class="download-btn"
            [attr.aria-label]="label()"
            [disabled]="downloading"
            (click)="onDownload()">
      @if (downloading) {
        <span class="download-btn__spinner" aria-hidden="true"></span>
      } @else if (showCheck) {
        <span class="download-btn__check" aria-hidden="true">&#10003;</span>
      } @else {
        <span class="download-btn__icon" aria-hidden="true">&#x2B73;</span>
      }
    </button>
  `,
  styles: [`
    .download-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: 1px solid var(--ngpf-light-gray-blue);
      border-radius: var(--ngpf-radius-sm);
      background: white;
      color: var(--ngpf-text-muted);
      cursor: pointer;
      transition: color 0.2s, border-color 0.2s, background 0.2s;
      font-size: 1rem;

      &:hover:not(:disabled) {
        color: var(--ngpf-bright-blue);
        border-color: var(--ngpf-bright-blue);
        background: var(--ngpf-soft-blue-tint);
      }

      &:focus-visible {
        outline: 2px solid var(--ngpf-sky-blue);
        outline-offset: 2px;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &__check {
        color: var(--ngpf-success);
        font-weight: 700;
      }

      &__spinner {
        width: 14px;
        height: 14px;
        border: 2px solid var(--ngpf-light-gray-blue);
        border-top-color: var(--ngpf-bright-blue);
        border-radius: 50%;
        animation: dl-spin 0.6s linear infinite;
      }
    }

    @keyframes dl-spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class DownloadButtonComponent {
  readonly label = input<string>('Download as PNG');
  readonly download = output<void>();

  protected downloading = false;
  protected showCheck = false;

  protected onDownload(): void {
    this.downloading = true;
    this.download.emit();
    // Visual feedback handled externally; show check after a delay
    setTimeout(() => {
      this.downloading = false;
      this.showCheck = true;
      setTimeout(() => { this.showCheck = false; }, 1500);
    }, 500);
  }
}
