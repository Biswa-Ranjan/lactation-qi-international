import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Storage } from '../../../node_modules/@ionic/storage';
import { ConstantProvider } from '../constant/constant';
import { resolveDefinition } from '../../../node_modules/@angular/core/src/view/util';

/*
  Generated class for the SettingsServiceProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class SettingsServiceProvider {

  constructor(public http: HttpClient,
    private storage: Storage) {}
  
  /**
   * This method should return baby admitted to lists
   *
   * @author Subhadarshani
   * @returns {Observable<any>}
   *
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
   * @author Naseem Akhtar
   * @since 0.0.1
   * 
   * This method will fetch the baby details from the DB and return it
   * to the settings component page.
   */
  async getBabyAdmittedToDataFromDB() {
    return await this.storage.get(ConstantProvider.dbKeyNames.babyAdmittedTo)
  }

  /**
   * @author Naseem Akhtar
   * @since 0.0.1
   * 
   * This method will save all the options in the DB after the
   * user is done with editing.
   */
  saveAll(babyAdmissionList: ITypeDetails[]): Promise<any> {
    let promise = new Promise( (resolve, reject) => {
      this.storage.set(ConstantProvider.dbKeyNames.babyAdmittedTo, babyAdmissionList)
        .then( data => {
          resolve(true)
        }, error => reject(error))
        .catch( error => reject(error))
    })
    return promise
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
