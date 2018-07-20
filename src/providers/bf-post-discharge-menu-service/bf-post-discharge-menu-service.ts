import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { ConstantProvider } from '../constant/constant';
import { Observable } from 'rxjs/Observable';
import { Storage } from '@ionic/storage';
import { DatePipe } from '@angular/common';
import { UtilServiceProvider } from '../util-service/util-service';
import { UserServiceProvider } from '../user-service/user-service';
import { PppServiceProvider } from '../ppp-service/ppp-service';

/**
 * @author - Naseem Akhtar (naseem@sdrc.co.in)
 * @since - 0.0.1
 * 
 * This service will be used to fecth the mobile DB related data for 
 * the breast feed post discharge menu component.
 */

@Injectable()
export class BfPostDischargeMenuServiceProvider {

  constructor(public http: HttpClient,
    private storage: Storage,
    private datePipe: DatePipe,
    private utilService: UtilServiceProvider,
    private userService: UserServiceProvider,
    private pppServiceProvider: PppServiceProvider) {}

  /**
   * This function will fetch the menu for post discarge menu.
   * @author - Naseem Akhtar
   * @since - 0.0.1
   */
  getPostDischargeMenu(): Observable < ITypeDetails[] >{
    return this.http.get("./assets/data.json").map((response: Response) => {
      return (response as any).
        typeDetails.filter(menu => menu.typeId == ConstantProvider.postDischargeMenu);
    })
    .catch(this.handleError);
  }

  /**
   * This method will return all the possible breast feeding post discharge status's
   * for display in the drop down.
   * 
   * @author - Naseem Akhtar (naseem@sdrc.co.in)
   * @since - 0.0.1
   */
  getBreastfeedingStatusPostDischarge(): Observable < ITypeDetails[] > {
    return this.http.get("./assets/data.json")
      .map((response: Response) => {
        return (response as any).typeDetails.
          filter(d => d.typeId === ConstantProvider.BFStatusPostDischargeTypeId.bfStatusPostDischargeTypeId)
      })
      .catch(this.handleError);
  };
  
  getBfpdDataFromDB(babyCode: string, timePoints: ITypeDetails[], status: ITypeDetails[]): Promise<any> {
    let promise = new Promise( (resolve, reject) => {
      this.storage.get(ConstantProvider.dbKeyNames.bfpds)
        .then( (bfpdList: IBFPD[]) => {
            let tempBfpd: IBFPD[] = this.analyzeBabyDataInDB(babyCode, bfpdList === null ? []: bfpdList.filter(d => 
              d.babyCode === babyCode), timePoints, status)
            resolve(tempBfpd)
        }).catch(err => {
          reject(err.message);
        })
    })
    return promise
  }

  /**
   * @author Naseem Akhtar
   * @param babyCode
   * @param bfpdList 
   * @param timePoints 
   * @param status 
   * 
   * This method will be used to check the no. of bfpd records that are stored in the DB for the
   * selected child, if for any time point a record is not available, that will be added to the array
   * in this method and the method will retuern a bfpdList which will contain all the time points.
   */
  analyzeBabyDataInDB(babyCode: string, bfpdList: IBFPD[], timePoints: ITypeDetails[], status: ITypeDetails[]) {
    for (let x = 0; x < timePoints.length; x++) {
      let timePointExists = false;
      for (let y = 0; y < bfpdList.length; y++) {
        if(bfpdList[y].timeOfBreastFeeding === timePoints[x].id)
          timePointExists = true
      }
      if(!timePointExists) {
        let bfpd: IBFPD = this.getNewBFPDObject(babyCode)
        bfpd.timeOfBreastFeeding = timePoints[x].id
        bfpd.timeOfBfName = timePoints[x].name
        bfpdList.push(bfpd)
      }
    }
    bfpdList.sort(function(a,b) { return a.timeOfBreastFeeding - b.timeOfBreastFeeding})
    return bfpdList
  }

  /**
   * @author - Naseem Akhtar
   * @param babyCode - babyCode to set in the object
   * 
   * This method will return a new bfpd object
   */
  getNewBFPDObject(babyCode: string) {
    let bfpd: IBFPD = {
      babyCode: babyCode,
      breastFeedingStatus: null,
      createdDate: null,
      dateOfBreastFeeding: null,
      id: null,
      isSynced: null,
      syncFailureMessage: null,
      timeOfBreastFeeding: null,
      updatedDate: null,
      userId: null,
      uuidNumber: null,
      timeOfBfName: null
    }
    return bfpd
  }


  saveUpdateBfpd(bfpdList: IBFPD[], babyCode: string): Promise<any> {
    let promise = new Promise( (resolve, reject) => {
      this.pppServiceProvider.deleteSpsRecord(babyCode)
      let tempBfpdList: IBFPD[] = []
      bfpdList.forEach( bfpd => {
        if(bfpd.breastFeedingStatus != null) {
          bfpd.createdDate = bfpd.createdDate ? bfpd.createdDate : 
            this.datePipe.transform(new Date(), 'yyyy-MM-dd HH:mm:ss')
          bfpd.updatedDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd HH:mm:ss')
          bfpd.uuidNumber = this.utilService.getUuid()
          bfpd.userId = this.userService.getUser().email

          tempBfpdList.push(bfpd)
        }
      })

      this.storage.get(ConstantProvider.dbKeyNames.bfpds)
        .then( (dbBfpdList: IBFPD[]) => {
          let finalBfpdList: IBFPD[] = this.prepareDataForDB(dbBfpdList == null ? [] :  dbBfpdList, 
            tempBfpdList, babyCode)
          
          this.storage.set(ConstantProvider.dbKeyNames.bfpds, finalBfpdList)
            .then( () => resolve(true), 
            error => reject(error))
            .catch( error => reject(error))
        }, error => reject(error))
        .catch( error => reject(error))
    })
    return promise
  }

  prepareDataForDB(dbBfpdList: IBFPD[], tempBfpdList: IBFPD[], babyCode: string) {
    if(dbBfpdList != null && dbBfpdList.length > 0) {
      let index = dbBfpdList.findIndex(d => d.babyCode === babyCode)
      if(index >= 0) {
        let indexOfrecordsToRemove: number[] = []
        for (let x = 0; x < dbBfpdList.length; x++) {
          if(dbBfpdList[x].babyCode === babyCode)
            indexOfrecordsToRemove.push(x)
        }

        indexOfrecordsToRemove.reverse()
        indexOfrecordsToRemove.forEach( index => dbBfpdList.splice(index, 1) )
      }
    }

    dbBfpdList.push(...tempBfpdList)
    return dbBfpdList
  }

  /**
   * @author - Ratikanta
   * @param error - this returns the error that occured while making http call
   * 
   * This method handles the error that occurs while making a http call
   */
  private handleError(error: HttpErrorResponse) {

    let messageToUser;
    if (error.error instanceof ErrorEvent) {
      messageToUser = `An error occurred: ${error.error.message}`;
    } else {
      messageToUser = `Backend error, code ${error.status}, ` +
        `message: ${error.message}`;
    }
    return new ErrorObservable (messageToUser);
  };

}
