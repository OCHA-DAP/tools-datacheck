import { Directive, ChangeDetectorRef, Output, HostListener, EventEmitter } from '@angular/core';

declare const Dropbox: any;

@Directive({
  selector: '[hdxDropboxchooser]'
})
export class DropboxchooserDirective {

  @Output()
  urlSelect = new EventEmitter<string>();

  constructor(private cd: ChangeDetectorRef) {
    console.log('Dropbox Chooser init');
  }

  @HostListener('click')
  loadDropboxChooser() {
    const options = {
      success: function(files) {
        // alert('Here\'s the file link: ' + files[0].link);
        const url: string = files[0].link;
        this.urlSelect.emit(url);
        this.cd.detectChanges();
      }.bind(this),
      linkType: 'direct'
    };

    Dropbox.choose(options);
  }

}
