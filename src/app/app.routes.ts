import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { InteractiveOne } from './features/interactive-one/interactive-one';
import { InteractiveTwo } from './features/interactive-two/interactive-two';
import { TemplateExample } from './features/template-example/template-example';
import { NgpfVocabularyFlashcards } from './features/ngpf-vocabulary-flashcards/ngpf-vocabulary-flashcards';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'interactive-one', component: InteractiveOne },
  { path: 'interactive-two', component: InteractiveTwo },
  { path: 'template-example', component: TemplateExample },
  { path: 'ngpf-vocabulary-flashcards', component: NgpfVocabularyFlashcards },
  { path: '**', redirectTo: '' }
];
