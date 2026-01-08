import { Component } from '@angular/core';

@Component({
  selector: 'app-bottom-header',
  standalone: true,
  imports: [],
  templateUrl: './bottom-header.html',
  styleUrl: './bottom-header.scss'
})
export class BottomHeader {
  protected readonly footerText = 'NGPF Interactives';
}
