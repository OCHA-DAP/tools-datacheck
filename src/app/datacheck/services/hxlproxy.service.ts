import { environment } from './../../../environments/environment';
import { Observable } from 'rxjs/Observable';
import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

@Injectable()
export class HxlproxyService {

  constructor(private http: Http) { }

  public makeValidationCall(params: { key: string, value: string }[]): Observable<any> {
    const mapFunction = (response: Response) => {
      const json = response.json();
      let locations = [];
      for (let i = 0; i < json.issues.length; i++) {
        const issue = json.issues[i];
        issue.locations.sort( (el1, el2) => el1.row - el2.row );
        issue.locations.forEach(element => {
          element.type = issue.description;
          element.row += 2;
          // element.hashtag = issue.tag_pattern;
        });
        locations = locations.concat(issue.locations);
      }
      json['flatErrors'] = locations;
      return json;
    };
    const serverUrl = `${environment['hxlProxyValidate']}?`;
    return this.makeCallToHxlProxy<any[]>(serverUrl, params, mapFunction);
  }

  public makeDataCall(params: { key: string, value: string }[]): Observable<any[][]> {
    const mapFunction = (response: Response) => {
      const json = response.json();
      return json;
    };

    const serverUrl = `${environment['hxlProxy']}?`;
    return this.makeCallToHxlProxy<any[]>(serverUrl, params, mapFunction);
  }

  /**
   * Makes a call to the hxl proxy
   * @param params parameter pairs that will be sent to the HXL Proxy in the URL (the data src url should not be specified here)
   * @param mapFunction function that will map the result to some data structure
   * @param errorHandler error handling function
   */
  private makeCallToHxlProxy<T>(serverUrl: string, params: { key: string, value: string }[],
    mapFunction: (response: Response) => T,
    errorHandler?: () => Observable<T>): Observable<T> {

    // let myMapFunction: (response: Response) => T;
    // if (mapFunction) {
    //   myMapFunction = mapFunction;
    // } else {
    //   myMapFunction = (response: Response) => response.json();
    // }

    let url = serverUrl;
    if (params) {
      for (let i = 0; i < params.length; i++) {
        url += '&' + params[i].key + '=' + encodeURIComponent(params[i].value);
      }
    }
    console.log('The call will be made to: ' + url);
    return this.http.get(url).map(mapFunction.bind(this)).catch(err => this.handleError(err, errorHandler));
  }

  private handleError (error: Response | any, errorHandler?: () => Observable<any>) {
    let errMsg: string;
    if (error instanceof Response) {
      try {
        const body = error.json() || '';
        const err = body.error || JSON.stringify(body);
        errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
      } catch (e) {
        errMsg = e.toString();
      }
    } else {
      errMsg = error.message ? error.message : error.toString();
    }
    console.error('ERR! ' + errMsg);
    const retValue = errorHandler ? errorHandler() : Observable.throw(errMsg);
    return retValue;
  }

}
