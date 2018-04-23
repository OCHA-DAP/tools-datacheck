import { Directive, HostListener, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';

declare const gapi: any;
declare const google: any;

@Directive({
  selector: '[hdxGooglepicker]'
})
export class GooglepickerDirective {

  // The Browser API key obtained from the Google API Console.
  readonly developerKey = 'AIzaSyDI2YqaXNwndxy6UEisT-5fUeJ2FMtz0VY';

  // The Client ID obtained from the Google API Console.
  readonly clientId = '378410536565-mvin02sm8rbr0f8rq9q9injarh93ego4.apps.googleusercontent.com';

  readonly scope = ['https://www.googleapis.com/auth/drive.readonly'];

  pickerApiLoaded = false;
  oauthToken;
  @Output()
  urlSelect = new EventEmitter<string>();

  constructor(private cd: ChangeDetectorRef) {
    console.log('Google Picker init');
  }

  @HostListener('click')
  loadGooglePicker() {
    let picker = null;
    const onAuthApiLoad = function () {
      gapi.auth.authorize(
          {
            'client_id': this.clientId,
            'scope': this.scope,
            'immediate': false
          },
          handleAuthResult);
    }.bind(this);

    const onPickerApiLoad = function () {
      this.pickerApiLoaded = true;
      createPicker();
    }.bind(this);

    const handleAuthResult = function (authResult) {
      if (authResult && !authResult.error) {
        this.oauthToken = authResult.access_token;
        createPicker();
      }
    }.bind(this);

    const createPicker = function () {
      if (this.pickerApiLoaded && this.oauthToken) {
        picker = new google.picker.PickerBuilder().
            addView(google.picker.ViewId.DOCS).
            setOAuthToken(this.oauthToken).
            setDeveloperKey(this.developerKey).
            setCallback(pickerCallback).
            build();
        picker.setVisible(true);
      }
    }.bind(this);

    const pickerCallback = function (data) {
      let url = '';
      if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
        const doc = data[google.picker.Response.DOCUMENTS][0];
        if (doc[google.picker.Document.MIME_TYPE] === 'application/vnd.google-apps.spreadsheet') {
          url = `https://docs.google.com/spreadsheets/d/${doc[google.picker.Document.ID]}/export?format=csv`;
        } else {
          url = `https://drive.google.com/uc?export=download&id=${doc[google.picker.Document.ID]}`;
        }
        const message = 'You picked: ' + url;
        // console.log(message);
        this.urlSelect.emit(url);
        this.cd.detectChanges();
        picker.setVisible(false);
      }
    }.bind(this);

    gapi.load('auth', {'callback': onAuthApiLoad});
    gapi.load('picker', {'callback': onPickerApiLoad});
  }

}
