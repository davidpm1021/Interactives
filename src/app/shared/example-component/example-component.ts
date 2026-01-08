import { Component } from '@angular/core';

@Component({
  selector: 'app-example-component',
  standalone: true,
  imports: [],
  templateUrl: './example-component.html',
  styleUrl: './example-component.scss'
})
export class ExampleComponent {
  protected readonly message = 'This is a shared example component!';
}

