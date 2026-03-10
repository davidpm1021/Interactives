import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TopHeader } from '../../shared/top-header/top-header';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, TopHeader],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly title = 'NGPF Interactives';
}
