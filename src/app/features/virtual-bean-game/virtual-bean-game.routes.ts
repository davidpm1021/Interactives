import { Routes } from '@angular/router';
import { VirtualBeanGame } from './virtual-bean-game';
import { AggregatorComponent } from './components/aggregator/aggregator';

export const VIRTUAL_BEAN_GAME_ROUTES: Routes = [
  {
    path: '',
    component: VirtualBeanGame,
    title: 'Virtual Bean Game | NGPF',
  },
  {
    path: 'aggregator',
    component: AggregatorComponent,
    title: 'Bean Game Aggregator | NGPF',
  },
];
