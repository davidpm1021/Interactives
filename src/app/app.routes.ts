import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { TemplateExample } from './features/template-example/template-example';
import { CarPreferences } from './features/car-preferences/car-preferences';
import { DarkPatternsGame } from './features/dark-patterns-game/dark-patterns-game';
import { UnderstandingAmortization } from './features/understanding-amortization/understanding-amortization';
import { NgpfVocabularyFlashcards } from './features/ngpf-vocabulary-flashcards/ngpf-vocabulary-flashcards';

export const routes: Routes = [
  { path: '', component: Home, title: 'NGPF Interactives' },
  { path: 'template-example', component: TemplateExample },
  { path: 'ngpf-vocabulary-flashcards', component: NgpfVocabularyFlashcards },
  {
    path: 'virtual-bean-game',
    loadChildren: () =>
      import('./features/virtual-bean-game/virtual-bean-game.routes').then(
        (m) => m.VIRTUAL_BEAN_GAME_ROUTES,
      ),
  },
  { path: 'car-preferences', component: CarPreferences, title: 'Your Driving Preferences | NGPF' },
  { path: '**', redirectTo: '' },
  { path: 'ngpf-vocabulary-flashcards', component: NgpfVocabularyFlashcards, title: 'Vocabulary Flashcards | NGPF' },
  { path: 'understanding-amortization', component: UnderstandingAmortization, title: 'Loan Amortization Calculator | NGPF' },
  { path: 'dark-patterns-game', component: DarkPatternsGame, title: 'Dark Patterns Game | NGPF' },
  { path: '**', redirectTo: '' },
];
