import { RecipeService } from './datacheck/services/recipe.service';
import { ConfigService } from './datacheck/config.service';
import { HxlproxyService } from './datacheck/services/hxlproxy.service';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { DatacheckComponent } from './datacheck/datacheck.component';
import { AppRoutingModule } from './app-routing.module';
import { ImportComponent } from './datacheck/import/import.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from './common/common.module';
import { SimpleModule } from 'hxl-preview-ng-lib';
import { HotTableModule } from '@handsontable/angular';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ModalModule } from 'ngx-bootstrap';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [
    AppComponent,
    DatacheckComponent,
    ImportComponent
  ],
  imports: [
    ModalModule.forRoot(),
    BsDropdownModule.forRoot(),
    SimpleModule,
    CommonModule,
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    HotTableModule.forRoot(),
    TooltipModule.forRoot()
  ],
  providers: [
    HxlproxyService,
    ConfigService,
    RecipeService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
