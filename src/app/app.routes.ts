import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { TemplateExample } from './features/template-example/template-example';
import { DarkPatternsGame } from './features/dark-patterns-game/dark-patterns-game';
import { NgpfVocabularyFlashcards } from './features/ngpf-vocabulary-flashcards/ngpf-vocabulary-flashcards';

export const routes: Routes = [
  { path: '', component: Home, title: 'NGPF Interactives' },
  { path: 'template-example', component: TemplateExample, title: 'Template Example | NGPF' },
  { path: 'ngpf-vocabulary-flashcards', component: NgpfVocabularyFlashcards, title: 'Vocabulary Flashcards | NGPF' },
  { path: 'dark-patterns-game', component: DarkPatternsGame, title: 'Dark Patterns Game | NGPF' },
  { path: '**', redirectTo: '' },
];
