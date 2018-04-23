import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ImportComponent } from './datacheck/import/import.component';

const routes: Routes = [
  {
    path: 'import',
    component: ImportComponent,
    data: {
      title: 'Import'
    }
  },
  { path: '**',
    redirectTo: '/import',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
