import { Component } from '@angular/core';
import { TopHeader } from '../../shared/top-header/top-header';
import { BottomHeader } from '../../shared/bottom-header/bottom-header';
import { ExampleComponent } from '../../shared/example-component/example-component';

@Component({
  selector: 'app-template-example',
  standalone: true,
  imports: [TopHeader, BottomHeader, ExampleComponent],
  templateUrl: './template-example.html',
  styleUrl: './template-example.scss'
})
export class TemplateExample {
  protected readonly title = 'Template Example';
}
