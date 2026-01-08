import { Component } from '@angular/core';

@Component({
  selector: 'app-top-header',
  standalone: true,
  imports: [],
  templateUrl: './top-header.html',
  styleUrl: './top-header.scss'
})
export class TopHeader {
  protected readonly title = 'NGPF Interactives';
}

