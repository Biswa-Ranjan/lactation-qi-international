import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

/*
  Generated class for the LactationProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class LactationProvider {

  /**
   * This prperty will tell us version name of the app. It is set to '2.1.0' becuase the current version is
   * '2.1.0'.
   * We have to change the it accordingly. Yes we can get it from android device, when it comes to PWA,
   * the default will help us.
   */
  private appVersionName : string = '2.0.0'

  /**
   * It defines the ess data entry platform
   * @author Jagat Bandhu
   * @since 2.0.0
   */
  private platform: LactationPlatform

  constructor(public http: HttpClient) {
    console.log('Hello LactationProvider Provider');
  }

  setAppVersionName(appVersionName: string){
    this.appVersionName = appVersionName
  }

  getAppVersionName() : string{
    return this.appVersionName
  }

  getPlatform(){
    return this.platform
  }

  setPlatform(platform: LactationPlatform){
    this.platform = platform
  }

}
