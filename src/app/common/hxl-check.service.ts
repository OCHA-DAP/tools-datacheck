import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Injectable } from '@angular/core';

// declare const JSON: any;

export interface HxlCheckResponse {
  status: boolean;
}

@Injectable()
export class HxlCheckService {

  private hxlCheck: string;

  constructor(private http: Http) { }

  public init(hxlCheck) {
    this.hxlCheck = hxlCheck;
  }

  public check(dataUrl): Observable<HxlCheckResponse> {
    const fullUrl = `${this.hxlCheck}?url=${dataUrl}`;
    console.log('Full url is: ' + fullUrl);

    const obs = this.http.get(fullUrl)
      .map( (r: Response) => r.json() )
      .catch( (err: any, caught: Observable<any>) => {
        return Observable.of({
          'status': false
        });
      });

    return obs;
  }

}
