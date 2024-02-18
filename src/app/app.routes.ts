import { Routes } from '@angular/router';
import { TestSubComponent } from './test-sub/test-sub.component';
import { MainComponent } from './main/main.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'ngx-dropdown-ease' },
  { path: 'ngx-dropdown-ease', component: MainComponent },
  { path: 'test', component: TestSubComponent },
];
