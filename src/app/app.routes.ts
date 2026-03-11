import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { InteractiveOne } from './features/interactive-one/interactive-one';
import { InteractiveTwo } from './features/interactive-two/interactive-two';
import { TemplateExample } from './features/template-example/template-example';
import { UnderstandingAmortization } from './features/understanding-amortization/understanding-amortization';
import { NgpfVocabularyFlashcards } from './features/ngpf-vocabulary-flashcards/ngpf-vocabulary-flashcards';

export const routes: Routes = [
  { path: '', component: Home, title: 'NGPF Interactives' },
  { path: 'interactive-one', component: InteractiveOne },
  { path: 'interactive-two', component: InteractiveTwo },
  { path: 'template-example', component: TemplateExample },
<<<<<<< HEAD
  { path: 'ngpf-vocabulary-flashcards', component: NgpfVocabularyFlashcards },
  { path: 'understanding-amortization', component: UnderstandingAmortization, title: 'Loan Amortization Calculator | NGPF' },
=======
  { path: 'ngpf-vocabulary-flashcards', component: NgpfVocabularyFlashcards, title: 'Vocabulary Flashcards | NGPF' },
>>>>>>> main
  { path: '**', redirectTo: '' }
];
