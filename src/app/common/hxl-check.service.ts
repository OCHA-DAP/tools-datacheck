import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// declare const JSON: any;

export interface HxlCheckResponse {
  status: boolean;
}

@Injectable()
export class HxlCheckService {

  private hxlCheck: string;

  constructor(private httpClient: HttpClient) { }

  public init(hxlCheck) {
    this.hxlCheck = hxlCheck;
  }

  public check(dataUrl): Observable<HxlCheckResponse> {
    const fullUrl = `${this.hxlCheck}?url=${dataUrl}`;
    console.log('Full url is: ' + fullUrl);

    const obs = this.httpClient.get(fullUrl)
      .pipe(
        catchError( (err: any, caught: Observable<any>) => {
          return of({
            'status': false
          });
        })
      );
    return obs;
  }
}
