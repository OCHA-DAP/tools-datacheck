import { NgModule } from '@angular/core';
import { CommonModule as NgCommonModule } from '@angular/common';
import { GooglepickerDirective } from './googlepicker.directive';
import { DropboxchooserDirective } from './dropboxchooser.directive';
import { HxlCheckService } from './hxl-check.service';
import { AnalyticsService } from './analytics.service';
import { DragDropUploadComponent } from './drag-drop-upload/drag-drop-upload.component';

@NgModule({
  imports: [
    NgCommonModule
  ],
  declarations: [GooglepickerDirective, DropboxchooserDirective, DragDropUploadComponent],
  exports: [GooglepickerDirective, DropboxchooserDirective, DragDropUploadComponent],
  providers: [HxlCheckService, AnalyticsService]
})
export class CommonModule { }
