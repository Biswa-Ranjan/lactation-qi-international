import {
  HttpClient,
  HttpErrorResponse
} from '@angular/common/http';
import {
  Injectable
} from '@angular/core';
import {
  Observable
} from 'rxjs';
import {
  ErrorObservable
} from 'rxjs/observable/ErrorObservable';
import {
  File
} from '@ionic-native/file'
/*
  Generated class for the SettingsServiceProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class SettingsServiceProvider {

  constructor(public http: HttpClient, private file: File) {   
  }
  /**
   * This method should return baby admitted to lists
   *
   * @author Subhadarshani
   * @returns {Observable<any>}
   * @memberof AddNewPatientServiceProvider
   */
  getDataFromAssetsFolder(): Observable < IData > {
    return this.http
      .get("./assets/data.json")
      .map((response: Response) => {
        return response
      })
      .catch(this.handleError);
  }
  /**
   * @author - Subhadarshani
   * @param error - this returns the error that occured while making http call
   * 
   * This method handles the error that occurs while making a http call
   */
  private handleError(error: HttpErrorResponse) {
    let messageToUser;
    if (error.error instanceof ErrorEvent) {
      messageToUser = `An error occurred: ${error.error.message}`;
    } else {
      messageToUser =
        `Backend error, code ${error.status}, ` + `message: ${error.message}`;
    }
    return new ErrorObservable(messageToUser);
  }
  

}
