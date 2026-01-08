import { Component } from '@angular/core';
import { TopHeader } from '../../shared/top-header/top-header';
import { BottomHeader } from '../../shared/bottom-header/bottom-header';
import { ExampleComponent } from '../../shared/example-component/example-component';

@Component({
  selector: 'app-interactive-one',
  standalone: true,
  imports: [TopHeader, BottomHeader, ExampleComponent],
  templateUrl: './interactive-one.html',
  styleUrl: './interactive-one.scss'
})
export class InteractiveOne {
  protected readonly title = 'Interactive One';
}

