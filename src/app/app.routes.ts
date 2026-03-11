import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { TemplateExample } from './features/template-example/template-example';
import { UnderstandingAmortization } from './features/understanding-amortization/understanding-amortization';
import { NgpfVocabularyFlashcards } from './features/ngpf-vocabulary-flashcards/ngpf-vocabulary-flashcards';

export const routes: Routes = [
  { path: '', component: Home, title: 'NGPF Interactives' },
  { path: 'template-example', component: TemplateExample },
  { path: 'ngpf-vocabulary-flashcards', component: NgpfVocabularyFlashcards, title: 'Vocabulary Flashcards | NGPF' },
  { path: 'understanding-amortization', component: UnderstandingAmortization, title: 'Loan Amortization Calculator | NGPF' },
  { path: '**', redirectTo: '' }
];
