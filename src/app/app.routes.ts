import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { TemplateExample } from './features/template-example/template-example';
import { UnderstandingAmortization } from './features/understanding-amortization/understanding-amortization';
import { NgpfVocabularyFlashcards } from './features/ngpf-vocabulary-flashcards/ngpf-vocabulary-flashcards';

export const routes: Routes = [
  { path: '', component: Home, title: 'NGPF Interactives' },
  { path: 'template-example', component: TemplateExample, title: 'Template Example | NGPF' },
  { path: 'ngpf-vocabulary-flashcards', component: NgpfVocabularyFlashcards, title: 'Vocabulary Flashcards | NGPF' },
  { path: 'understanding-amortization', component: UnderstandingAmortization, title: 'Loan Amortization Calculator | NGPF' },
  {
    path: 'car-preferences',
    title: 'Your Driving Preferences | NGPF',
    loadComponent: () => import('./features/car-preferences/car-preferences').then((m) => m.CarPreferences),
  },
  {
    path: 'stock-tracker',
    title: 'Stock Tracker | NGPF',
    loadComponent: () => import('./features/stock-tracker/stock-tracker').then((m) => m.StockTracker),
  },
  {
    path: 'retirement-calculator',
    title: 'Retirement Calculator | NGPF',
    loadComponent: () => import('./features/retirement-calculator/retirement-calculator').then((m) => m.RetirementCalculator),
  },
  {
    path: 'net-worth-visualizer',
    title: 'Salary vs. Net Worth | NGPF',
    loadComponent: () => import('./features/net-worth-visualizer/net-worth-visualizer').then((m) => m.NetWorthVisualizer),
  },
  {
    path: 'cost-of-borrowing',
    title: 'Cost of Borrowing | NGPF',
    loadComponent: () => import('./features/cost-of-borrowing/cost-of-borrowing').then((m) => m.CostOfBorrowing),
  },
  {
    path: 'template-builder',
    title: 'Template Builder | NGPF',
    loadComponent: () => import('./features/template-builder/template-builder').then((m) => m.TemplateBuilder),
  },
  { path: '**', redirectTo: '' },
];
