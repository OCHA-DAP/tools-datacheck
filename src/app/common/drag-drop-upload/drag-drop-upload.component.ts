import { Component, ElementRef, EventEmitter, HostListener, OnInit, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'hdx-drag-drop-upload',
  templateUrl: './drag-drop-upload.component.html',
  styleUrls: ['./drag-drop-upload.component.less']
})
export class DragDropUploadComponent implements OnInit {

  highlight = false;

  @Output('selected') selected = new EventEmitter();
  @ViewChild('fileInput') fileInput:ElementRef;

  constructor() { }

  onDragOver(event) {
    event.preventDefault();
    this.highlight = true;
  }

  onDragLeave(event) {
    event.preventDefault();
    this.highlight = false;
  }

  onDrop(event) {
    event.preventDefault();
    this.highlight = false;
    this.selected.emit(event.dataTransfer.files[0]);
  }
  onSelect(event) {
    this.selected.emit(event.target.files[0]);
  }

  ngOnInit() {
  }

  onBrowse(event) {
    event.preventDefault();
    this.fileInput.nativeElement.click();

  }
}
