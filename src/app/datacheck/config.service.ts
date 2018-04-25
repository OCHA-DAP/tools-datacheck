import { Injectable } from '@angular/core';

@Injectable()
export class ConfigService {

  private config = {};
  constructor() { }

  public init(params: any): void {
    console.log('INITING CONFIG !!!');
    for (const key in params) {
      if (params.hasOwnProperty(key)) {
        this.config[key] = params[key];
      }
    }
  }

  public get(key: string, includeEnvironment?: boolean): string {
    includeEnvironment = includeEnvironment ? includeEnvironment : true;
    if (this.config.hasOwnProperty(key)) {
      return this.config[key];
    }
    //  else if (includeEnvironment) {
    //   return environment[key];
    // }
    return null;
  }

}
