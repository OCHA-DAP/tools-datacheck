import { environment } from './../../../environments/environment';
import { Observable } from 'rxjs/Observable';
import { Injectable } from '@angular/core';
import { Http, Response, RequestOptions, Headers, URLSearchParams } from '@angular/http';

export interface PostParam {
  key: string;
  value: string | File;
  type: string;
}
@Injectable()
export class HxlproxyService {

  constructor(private http: Http) { }

  public makeValidationCall(params: { key: string, value: string }[],
        postParams: PostParam[]): Observable<any> {

    const mapFunction = (response: Response) => {
      const json = response.json();
      let locations = [];
      json.issues = json.issues.sort( (a, b) => a.description > (b.description));
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
    const serverUrl = `${environment['hxlProxyValidate']}`;
    return this.makeCallToHxlProxy<any[]>(serverUrl, params, postParams, mapFunction);
  }

  // public makeDataCall(params: { key: string, value: string }[]): Observable<any[][]> {
  //   const mapFunction = (response: Response) => {
  //     const json = response.json();
  //     return json;
  //   };

  //   // Force the proxy to not use cache (useful for the case when the user has fixed his data)
  //   params = params ? params : [];
  //   params.push({
  //     key: 'force',
  //     value: 'on'
  //   });

  //   const serverUrl = `${environment['hxlProxy']}?`;
  //   return this.makeCallToHxlProxy<any[]>(serverUrl, params, null, mapFunction);
  // }

  /**
   * Makes a call to the hxl proxy
   * @param params parameter pairs that will be sent to the HXL Proxy in the URL (the data src url should not be specified here)
   * @param mapFunction function that will map the result to some data structure
   * @param errorHandler error handling function
   */
  private makeCallToHxlProxy<T>(serverUrl: string, params: { key: string, value: string }[],
    postParams: PostParam[],
    mapFunction: (response: Response) => T,
    errorHandler?: () => Observable<T>): Observable<T> {

    let url = serverUrl;
    if (params) {
      for (let i = 0; i < params.length; i++) {
        url += '&' + params[i].key + '=' + encodeURIComponent(params[i].value);
      }
    }
    let response: Observable<Response> = null;
    if (postParams) {
      const formData: any = new FormData();
      // const postString = postParams.reduce(
      //       (acc, p, i) => acc + (i > 0 ? '&' : '')  + p.key + '=' + encodeURIComponent(p.value), '');
      postParams.forEach(par => {
        if (par.type === 'json-as-file') {
          formData.append(par.key, new Blob([par.value], { type: 'application/json'}), `${par.key}.json`);
        } else {
          formData.append(par.key, par.value);
        }
      });

      // const headers = new Headers({ 'Content-Type': 'multipart/form-data' });
      // const options = new RequestOptions({ headers: headers });
      response = this.http.post(url, formData);
    } else {
      response = this.http.get(url);
    }
    return response.map(mapFunction.bind(this)).catch(err => this.handleError(err, errorHandler));
  }

  private handleError (error: Response | any, errorHandler?: () => Observable<any>) {
    let errMsg: string;
    if (error instanceof Response) {
      try {
        const body = error.json() || '';
        const err = body.error || JSON.stringify(body);
        errMsg = body; // `${error.status} - ${error.statusText || ''} ${err}`;
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
