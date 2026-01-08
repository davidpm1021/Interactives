import { Component } from '@angular/core';
import { TopHeader } from '../../shared/top-header/top-header';
import { BottomHeader } from '../../shared/bottom-header/bottom-header';
import { ExampleComponent } from '../../shared/example-component/example-component';

@Component({
  selector: 'app-interactive-two',
  standalone: true,
  imports: [TopHeader, BottomHeader, ExampleComponent],
  templateUrl: './interactive-two.html',
  styleUrl: './interactive-two.scss'
})
export class InteractiveTwo {
  protected readonly title = 'Interactive Two';
}

