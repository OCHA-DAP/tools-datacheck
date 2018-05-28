import { Component, ElementRef, EventEmitter, HostListener, OnInit, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'hdx-drag-drop-upload',
  templateUrl: './drag-drop-upload.component.html',
  styleUrls: ['./drag-drop-upload.component.less']
})
export class DragDropUploadComponent implements OnInit {

  highlight = false;
  filename = null;

  @Output('selected') selected = new EventEmitter();
  @ViewChild('fileInput') fileInput: ElementRef;

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
    const file = event.dataTransfer.files[0];
    this.filename = file.name;
    this.selected.emit(file);
  }
  onSelect(event) {
    const file = event.target.files[0];
    this.filename = file.name;
    this.selected.emit(file);
  }

  ngOnInit() {
  }

  onBrowse(event) {
    event.preventDefault();
    this.fileInput.nativeElement.click();

  }
}
