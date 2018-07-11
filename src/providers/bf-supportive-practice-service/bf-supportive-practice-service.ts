import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { HttpErrorResponse } from '@angular/common/http/src/response';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { ConstantProvider } from '../constant/constant';
import { Storage } from '@ionic/storage';
import { DatePipe } from '@angular/common';
import { UserServiceProvider } from '../user-service/user-service';
import { PppServiceProvider } from '../ppp-service/ppp-service';
import { UtilServiceProvider } from '../util-service/util-service';
import { LactationProvider } from '../lactation/lactation';

/**
 * @author - Naseem Akhtar (naseem@sdrc.co.in)
 * @since - 0.0.1
 *
 * This service will be used to fetch the mobile DB related data for
 * the breastfeed supportive practices component.
 */

@Injectable()
export class BfSupportivePracticeServiceProvider {

  isWeb : boolean = false;
  constructor(public http: HttpClient, private storage: Storage, private datePipe: DatePipe,
    private userService: UserServiceProvider,private pppServiceProvider: PppServiceProvider,
    private utilService: UtilServiceProvider, private lactationPlatform: LactationProvider) {
      this.isWeb = this.lactationPlatform.getPlatform().isWebPWA
    }

  /**
   * This method should return delivery method lists
   *
   * @author Naseem Akhtar
   * @returns {Observable<ITypeDetails[]>}
   * @memberof BfSupportivePracticeServiceProvider
   */
  getBreastfeedingSupportivePractice(): Observable < ITypeDetails[] > {
    return this.http.get("./assets/data.json")
      .map((response: Response) => {
        return (response as any).typeDetails.filter(d => d.typeId === ConstantProvider.BFSupportivePracticesTypeId.bfSupportivePracticesTypeId)
      })
      .catch(this.handleError);
  };

  /**
   * This method will return all the possible options for person who has performed bfsp for drop
   * down selection in the UI
   *
   * @author - Naseem Akhtar (naseem@sdrc.co.in)
   * @since - 0.0.1
   */
  getPersonWhoPerformedBSFP(): Observable < ITypeDetails[] > {
    return this.http.get("./assets/data.json")
      .map((response: Response) => {
        return (response as any).typeDetails.filter(d => d.typeId === ConstantProvider.PersonWhoPerformedBSFPTypeId.personWhoPerformedBSFPTypeId)
      })
      .catch(this.handleError);
  };

  /**
   * This method will be used to update or insert a new bfsp entry into the mobile DB.
   *
   * @author - Naseem Akhtar (naseem@sdrc.co.in)
   * @since - 0.0.1
   * @param bfspForm
   * @param existingDate
   * @param existingTime
   */
  saveNewBreastFeedingSupportivePracticeForm(bfspForm: IBFSP, newData: boolean): Promise <any> {
    let promise = new Promise((resolve, reject) => {
      bfspForm.isSynced = false;
      bfspForm.createdDate = bfspForm.createdDate === null ?
        this.datePipe.transform(new Date(), 'yyyy-MM-dd HH:mm:ss') : bfspForm.createdDate;
      bfspForm.updatedDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd HH:mm:ss');
      bfspForm.uuidNumber = this.utilService.getUuid();
      this.storage.get(ConstantProvider.dbKeyNames.bfsps)
        .then((val) => {
          let bfspForms: IBFSP[] = [];
          this.pppServiceProvider.deleteSpsRecord(bfspForm.babyCode)
          if (val != null && val.length > 0) {
            bfspForms = val;
            let index = bfspForms.findIndex(d=>d.babyCode === bfspForm.babyCode && d.dateOfBFSP === bfspForm.dateOfBFSP
              && d.timeOfBFSP === bfspForm.timeOfBFSP)
            if(index < 0) {
              bfspForm.id = this.getNewBfspId(bfspForm.babyCode)
              bfspForms.push(bfspForm)
              this.storage.set(ConstantProvider.dbKeyNames.bfsps, bfspForms)
                .then(data => {
                  resolve()
                })
                .catch(err => {
                  reject(err.message);
                })
            }else{
              if(!newData) {
                bfspForms.splice(index, 1, bfspForm)
                this.storage.set(ConstantProvider.dbKeyNames.bfsps, bfspForms)
                .then(data => {
                  resolve()
                })
                .catch(err => {
                  reject(err.message);
                })
              }else
                reject(ConstantProvider.messages.duplicateTime);
            }
          }else {
            bfspForm.id = this.getNewBfspId(bfspForm.babyCode);
            bfspForms.push(bfspForm)
            this.storage.set(ConstantProvider.dbKeyNames.bfsps, bfspForms)
              .then(data => {
                resolve()
              })
              .catch(err => {
                reject(err.message);
              })
          }
        }).catch(err => {
          reject(err.message);
        })

    });
    return promise;
  };

  /**
   * This method is used to fetch records for the selected baby and for the selected date.
   *
   * @param babyCode
   * @param date
   * @param isNewExpression
   */
  findByBabyCodeAndDate(babyCode: string, date: string, isNewExpression: boolean): Promise < IBFSP[] > {
    let promise: Promise < IBFSP[] > = new Promise((resolve, reject) => {
      if(date !== null){
      this.storage.get(ConstantProvider.dbKeyNames.bfsps)
        .then(data => {
          if (data != null) {
            data = (data as IBFSP[]).filter(d => d.babyCode === babyCode && d.dateOfBFSP === date);
            if ((data as IBFSP[]).length > 0) {
              resolve(this.defaultDisplayOfEntries(data, ConstantProvider.noOfRecordsByDefault - data.length, babyCode, date))
            } else {
              resolve(this.defaultDisplayOfEntries(data, ConstantProvider.noOfRecordsByDefault, babyCode, date))
            }
          } else {
            resolve(this.defaultDisplayOfEntries([], ConstantProvider.noOfRecordsByDefault, babyCode, date))
          }
        })
        .catch(err => {
          reject(err.message)
        })
      }else{
        resolve(this.defaultDisplayOfEntries([], ConstantProvider.noOfRecordsByDefault, babyCode, date));
      }
    });
    return promise;
  }

  /**
   * This method is going to give us a new BF expression id
   *
   * @param {string} babyCode This is the baby code for which we are creating the bf expression id
   * @returns {string} The new bf expression id
   * @author Naseem Akhtar
   * @since 0.0.1
   */
  getNewBfspId(babyCode: string): string {
    return babyCode + "bfsp" + this.datePipe.transform(new Date(), 'ddMMyyyyHHmmssSSS');
  }

  /**
   * This method is going to append a new BfExpression object to existing list
   *
   * @param {IBFSP[]} data The existing list
   * @param {string} babyCode The unique baby code
   * @param {date} The date of feeding
   * @returns {IBFSP[]} The final appended list
   * @memberof ExpressionBfDateProvider
   */
  appendNewRecordAndReturn(data: IBFSP[], babyCode: string, date?: string): IBFSP[] {
    //The blank feed object
    let bf: IBFSP = {
      id: null,
      babyCode: babyCode,
      dateOfBFSP: date,
      timeOfBFSP: null,
      bfspPerformed: null,
      personWhoPerformedBFSP: null,
      bfspDuration: null,
      isSynced: false,
      userId: this.userService.getUser().email,
      syncFailureMessage: null,
      createdDate: null,
      updatedDate: null,
      uuidNumber: null
    }

    if (data != null) {
      (data as IBFSP[]).push(bf);
    } else {
      data = [];
      data.push(bf)
    }
    return data
  };

  /**
   * @author - Naseem
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
    return new ErrorObservable(messageToUser);
  };


  /**
   * This method will delete a bfsp expression
   * @author Ratikanta
   * @since 0.0.1
   * @param {string} id
   * @returns {Promise<any>}
   *
   */
  delete(id: string): Promise<any>{
    let promise =  new Promise((resolve, reject)=>{
      if(id != undefined && id != null){
        this.storage.get(ConstantProvider.dbKeyNames.bfsps)
        .then(data=>{
          let index = (data as IBFSP[]).findIndex(d=>d.id === id);
          if(index >= 0){
            this.pppServiceProvider.deleteSpsRecord(data[index].babyCode);
            (data as IBFSP[]).splice(index, 1)
            this.storage.set(ConstantProvider.dbKeyNames.bfsps, data)
            .then(()=>{
              resolve()
            })
            .catch(err=>{
              reject(err.message)
            })
          }else{
            reject(ConstantProvider.messages.recordNotFound)
          }
        })
        .catch(err=>{
          reject(err.message)
        })
      }else {
        reject(ConstantProvider.messages.recordNotFound)
      }
    });
    return promise;
  }


    /**
   * This method will check whether we have the record with given baby id, date and time.
   * If all the attribute value will match, this will splice that record and append incoming record.
   * Because it has come for an update.
   *
   * If record does not match, this will just push the input record with existing once
   *
   * @author Ratikanta
   * @since 0.0.1
   * @param feedExpressions All the existing feed expressions
   * @param feedExpression incoming feed expression
   * @returns IFeed[] modified feed expressions
   */
  // private validateNewEntryAndUpdate(bfsps: IBFSP[], bfsp: IBFSP, index: number): IBFSP[] {
  //   if(index < 0) {
  //     bfsp.id = this.getNewBfspId(bfsp.babyCode);
  //   }else {
  //     bfsps.splice(index, 1);
  //   }

  //   bfsps.push(bfsp)
  //   return bfsps;
  // }

  getNewBfspEntry(babyCode:string, date: string) {
    let bfspObject: IBFSP = {
      babyCode: babyCode,
      bfspDuration: null,
      bfspPerformed: null,
      createdDate: null,
      dateOfBFSP: date,
      id: null,
      isSynced: null,
      personWhoPerformedBFSP: null,
      syncFailureMessage: null,
      timeOfBFSP: null,
      updatedDate: null,
      userId: this.userService.getUser().email,
      uuidNumber: null
    }
    return bfspObject
  }

  defaultDisplayOfEntries(bfspList: IBFSP[], count: number, babyCode: string, date: string) {
    for (let index = 0; index < count; index++) {
      bfspList.push(this.getNewBfspEntry(babyCode, date))
    }
    return bfspList
  }

  /**
   * @author Naseem Akhtar
   * @param bfspList 
   * @param babyCode 
   * @param date 
   * 
   * This method will be used to save multiple entries at once.
   */
  saveMultipleBfsp(bfspList: IBFSP[], babyCode: string, date: string): Promise<any> {
    let promise = new Promise((resolve, reject) => {
      this.storage.get(ConstantProvider.dbKeyNames.bfsps)
      .then( (data: IBFSP[]) => {
        if(data != null && data.length > 0 && data.filter(d => d.babyCode === babyCode 
          && d.dateOfBFSP === date).length > 0) {
          let validatedExpressions = this.validateMultipleExpressions(data, bfspList, babyCode, date)
          this.storage.set(ConstantProvider.dbKeyNames.bfsps, validatedExpressions)
          .then( d => resolve() )
          .catch( error => reject(error.message) )
        }else {
          data = data === null ? [] : data
          bfspList = this.setUpdatedDateAndUuidInExpressions(bfspList)
          data.push(...bfspList)
          this.storage.set(ConstantProvider.dbKeyNames.bfsps, data)
          .then( d => resolve() )
          .catch( error => reject(error.message) )
        }
      })
    })
    return promise
  }


  /**
   * @author Naseem Akhtar
   * @param bfExpressions 
   * @since 2.0.0
   * 
   * This method will be used to set created date, updated date and uuid for the expressions that are going
   * to be saved in DB
   */
  setUpdatedDateAndUuidInExpressions(bfspList: IBFSP[]) {
    bfspList.forEach(bfExpression => {
      bfExpression.createdDate = bfExpression.createdDate != null ? bfExpression.createdDate :
        this.datePipe.transform(new Date(), 'yyyy-MM-dd HH:mm:ss')
      bfExpression.updatedDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd HH:mm:ss')
      bfExpression.uuidNumber = this.utilService.getUuid()
    })

    return bfspList
  }

  /**
   * @author - Naseem Akhtar
   * @param dbBfspList - bfsp records of all baby present in the DB
   * @param bfspListToBeSaved - multiple bfsp records that needs to be saved
   * @param babyCode
   * @param date - date for which multiple entries have come.
   * 
   * This method will be used to validate multiple records for save all functionality.
   * All records for a particular date and baby is removed from the DB and then the records
   * received by @param bfspListToBeSaved are pushed to the expression array.
   */
  validateMultipleExpressions(dbBfspList: IBFSP[], bfspListToBeSaved: IBFSP[],
    babyCode: string, date: string) {

    let recordsToRemoveIndex: number[] = []
    for (let dbIndex = 0; dbIndex < dbBfspList.length; dbIndex++) {
      for (let index = 0; index < bfspListToBeSaved.length; index++) {
        if(dbBfspList[dbIndex].babyCode === babyCode && dbBfspList[dbIndex].dateOfBFSP === date
          && bfspListToBeSaved[index].dateOfBFSP === date 
          && dbBfspList[dbIndex].timeOfBFSP === bfspListToBeSaved[index].timeOfBFSP)
            recordsToRemoveIndex.push(dbIndex)
      }
    }

    recordsToRemoveIndex.reverse()
    recordsToRemoveIndex.forEach( index => dbBfspList.splice(index, 1) )
    bfspListToBeSaved = this.setUpdatedDateAndUuidInExpressions(bfspListToBeSaved)
    dbBfspList.push(...bfspListToBeSaved)

    return dbBfspList
  }

}
