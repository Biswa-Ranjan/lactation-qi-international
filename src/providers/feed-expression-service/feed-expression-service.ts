import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { HttpClient } from '@angular/common/http';
import "rxjs/Rx";
import { ConstantProvider } from '../constant/constant';
import { HttpErrorResponse } from '@angular/common/http/src/response';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Storage } from '@ionic/storage';
import { DatePipe } from '@angular/common';
import { UserServiceProvider } from '../user-service/user-service';
import { MessageProvider } from '../message/message';
import { PppServiceProvider } from '../ppp-service/ppp-service';
import { UtilServiceProvider } from '../util-service/util-service';
import { LactationProvider } from '../lactation/lactation';
import { OrderByTimeAscPipe } from '../../pipes/order-by-time-asc/order-by-time-asc';

/**
 * This service will only provide service to Feed component
 * @author Ratikanta
 * @since 0.0.1
 */
@Injectable()
export class FeedExpressionServiceProvider {

  isWeb : boolean = false;
  constructor(public http: HttpClient,
    private storage: Storage, private datePipe: DatePipe,private lactationPlatform: LactationProvider,
  private userService: UserServiceProvider,private pppServiceProvider: PppServiceProvider,
  private messageService: MessageProvider, private utilService: UtilServiceProvider) {
    this.isWeb = this.lactationPlatform.getPlatform().isWebPWA
  }



  /**
   * This method should return feeding method lists
   *
   * @author Ratikanta
   * @returns {Observable<ITypeDetails[]>}
   * @memberof FeedExpressionServiceProvider
   */
  getFeedingMethods(): Observable<ITypeDetails[]> {

    return this.http.get("./assets/data.json").map((response: Response) => {
               return (response as any).typeDetails.filter(d => d.typeId === ConstantProvider.FeedingTypeIds.feedingMethodTypeId)
           })
        .catch(this.handleError);
  }

  /**
   * This method should return location of feeding lists
   *
   * @author Ratikanta
   * @returns {Observable<ITypeDetails[]>}
   * @memberof FeedExpressionServiceProvider
   */
  getLocationOfFeedings(): Promise<any> {
    // return this.http.get("./assets/data.json").map((response: Response) => {
    //            return (response as any).typeDetails.filter(d => d.typeId === ConstantProvider.FeedingTypeIds.locationOfFeeding)
    //        })
    //     .catch(this.handleError);
    let promise = new Promise( (resolve, reject) => {
      this.storage.get(ConstantProvider.dbKeyNames.babyAdmittedTo)
        .then( (data: ITypeDetails[]) =>{
          resolve(data)
        }, error => reject(error))
        .catch(error => reject(error))
    })
    return promise
  }

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


  /**
   * This method is going to help us in save feed expression of a single time entry
   * @author Ratikanta
   * @since 0.0.1
   * @returns Promise<IDBOperationStatus>
   * @param feedExpression one feed expression entry
   *
   */

  saveFeedExpression(feedExpression: IFeed, newData: boolean): Promise<any> {
    let promise = new Promise((resolve, reject) => {
      feedExpression.isSynced = false;
      feedExpression.createdDate = feedExpression.createdDate === null ?
        this.datePipe.transform(new Date(), 'yyyy-MM-dd HH:mm:ss') : feedExpression.createdDate;
      feedExpression.updatedDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd HH:mm:ss');
      feedExpression.uuidNumber = this.utilService.getUuid();
      this.storage.get(ConstantProvider.dbKeyNames.feedExpressions)
      .then((val) => {
        let feedExpressions: IFeed[] = [];
        this.pppServiceProvider.deleteSpsRecord(feedExpression.babyCode)
        if(val != null && val.length > 0) {
          feedExpressions = val
          // let index = feedExpressions.findIndex(d=> d.babyCode === feedExpression.babyCode && d.dateOfFeed === feedExpression.dateOfFeed &&
          //   d.timeOfFeed === feedExpression.timeOfFeed)
          let index = feedExpressions.findIndex(d=> d.id === feedExpression.id)
          if(index < 0) {
            // index = feedExpressions.findIndex(d=>d.babyCode === feedExpression.babyCode &&
            //   d.dateOfFeed === existingDate && d.timeOfFeed === existingTime)
            // feedExpressions = this.validateNewEntryAndUpdate(feedExpressions, feedExpression, index)
            feedExpression.id = this.getNewFeedExpressionId(feedExpression.babyCode)
            feedExpressions.push(feedExpression)
            this.storage.set(ConstantProvider.dbKeyNames.feedExpressions, feedExpressions)
              .then(data=>{
                resolve()
              })
              .catch(err=>{
                reject(err.message);
              })
          }else {
            if(!newData) {
              feedExpressions.splice(index, 1, feedExpression)
              // feedExpressions = this.validateNewEntryAndUpdate(feedExpressions, feedExpression, index)
              this.storage.set(ConstantProvider.dbKeyNames.feedExpressions, feedExpressions)
                .then(data=>{
                  resolve()
                })
                .catch(err=>{
                  reject(err.message);
                })
            }else
              reject(ConstantProvider.messages.duplicateTime);
          }
        }else {
          feedExpression.id = this.getNewFeedExpressionId(feedExpression.babyCode)
          feedExpressions.push(feedExpression)
          this.storage.set(ConstantProvider.dbKeyNames.feedExpressions, feedExpressions)
          .then(data=>{
            resolve()
          })
          .catch(err=>{
            reject(err.message);
          })
        }
      }).catch(err=>{
        reject(err.message);
      })


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
   * @author - Naseem Akhtar
   */
  private validateNewEntryAndUpdate(feedExpressions: IFeed[], feedExpression: IFeed, index: number): IFeed[]{

    if(index < 0) {
      feedExpression.id = this.getNewFeedExpressionId(feedExpression.babyCode);
    }else {
      feedExpressions.splice(index, 1);
    }

    feedExpressions.push(feedExpression)
    return feedExpressions;

  }

  /**
   * This method is going to fetch data from feed expression key by baby code and date
   * @param babyCode The baby code for which we will fetch data
   * @param date The date for which we will fetch data
   * @param isNewExpression If the controll has come from feed date list, to create a new entry
   * @returns Promise<IFeed[]> list of feed expression entries
   * @author Ratikanta
   * @since 0.0.1
   */
  findByBabyCodeAndDate(babyCode: string, date: string, isNewExpression: boolean): Promise<IFeed[]>{
    let promise: Promise<IFeed[]> = new Promise((resolve, reject)=>{
      if(date !== null){
        this.storage.get(ConstantProvider.dbKeyNames.feedExpressions)
        .then(data=>{
          if(data != null){
            data = (data as IFeed[]).filter(d => (d.babyCode === babyCode && d.dateOfFeed === date))
            if((data as IFeed[]).length > 0) {
              resolve(this.defaultDisplayOfEntries(data, ConstantProvider.noOfRecordsByDefault - data.length, babyCode, date))
            }else{
              resolve(this.defaultDisplayOfEntries(data, ConstantProvider.noOfRecordsByDefault, babyCode, date))
            }
          }else{
            resolve(this.defaultDisplayOfEntries([], ConstantProvider.noOfRecordsByDefault, babyCode, date))
          }
        })
        .catch(err=>{
          reject(err.message)
        })
      }else{
        resolve(this.defaultDisplayOfEntries([], ConstantProvider.noOfRecordsByDefault, babyCode, date))
      }
    });
    return promise;
  }

  /**
   * This method is going to give us a new feed expression id
   *
   * @param {string} babyCode This is the baby code for which we are creating the feed expression id
   * @returns {string} The new feed expression id
   * @memberof FeedExpressionServiceProvider
   * @author Ratikanta
   * @since 0.0.1
   */
  getNewFeedExpressionId(babyCode: string): string{
    return babyCode + "feid" + this.datePipe.transform(new Date(), 'ddMMyyyyHHmmssSSS');
  }

/**
 * This method is going to append a new feed object to axisting list
 *
 * @param {IFeed[]} data The existing list
 * @param {string} babyCode The unique baby code
 * @param {date} The date of feeding
 * @returns {IFeed[]} The final appended list
 * @memberof FeedExpressionServiceProvider
 */
  async appendNewRecordAndReturn(data: IFeed[], babyCode: string, count: number, date?: string) {
    if(data === null) {
      data = []
    }
    else {
      for (let index = 0; index <= count; index++) {
        data.push(await this.getNewFeedExpressionEntry(babyCode, date))
      }
    }

    return data
  }

  /**
   * This method will delete a expression
   * @author Ratikanta
   * @since 0.0.1
   * @param {string} id
   * @returns {Promise<any>}
   * @memberof SaveExpressionBfProvider
   */
  delete(id: string): Promise<any>{
    let promise =  new Promise((resolve, reject)=>{
      if(id != undefined && id != null){
        this.storage.get(ConstantProvider.dbKeyNames.feedExpressions)
        .then(data=>{
          let index = (data as IFeed[]).findIndex(d=>d.id === id);
          if(index >= 0){
            this.pppServiceProvider.deleteSpsRecord(data[index].babyCode);
            (data as IFeed[]).splice(index, 1)
            this.storage.set(ConstantProvider.dbKeyNames.feedExpressions, data)
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
   * This method will return time till first enteral feed,
   * compositionOfFirstEnteralFeed and
   * timeSpentInNICU as a promise
   *
   * @author Jagat Bandhu
   * @author - Naseem Akhtar (naseem@sdrc.co.in)
   * @since 1.1.0
   * @param babyCode
   * @param deliveryDate
   * @param deliveryTime
   */
  getTimeTillFirstEnteralFeed(babyCode: string,deliveryDate: string,deliveryTime: string): Promise<any>{
    let promise = new Promise<any>((resolve,reject)=>{
      this.storage.get(ConstantProvider.dbKeyNames.feedExpressions)
      .then(data=>{
        if(data !=null){

          let result = {
            timeTillFirstEnteralFeed: null,
            compositionOfFirstEnteralFeed: null,
            timeSpentInNICU: null
          }

          let feedData = (data as IFeed[]).filter(d=> d.babyCode === babyCode);

          /**
           * The following block of code is to calculate the no. of days spent in NICU
           */
          let timeSpentInNicuData = 0
          let feedDataForTimeSpentInNICU: IFeed[] = (data as IFeed[]).filter(d=> d.babyCode === babyCode &&
            (d.locationOfFeeding === ConstantProvider.typeDetailsIds.level1NICU ||
              d.locationOfFeeding === ConstantProvider.typeDetailsIds.level2SNCU ||
              d.locationOfFeeding === ConstantProvider.typeDetailsIds.level3NICU) )

          if(feedDataForTimeSpentInNICU.length > 0){
            let date = null;
            feedDataForTimeSpentInNICU.forEach(d => {
              if(d.dateOfFeed != date){
                timeSpentInNicuData++
                date = d.dateOfFeed
              }
            })
          }

          result.timeSpentInNICU = timeSpentInNicuData

          // let dateArray = []
          // feedData.forEach(d => dateArray.push(d.dateOfFeed))
          // dateArray = new OrderByDateAscPipe(this.datePipe).transform(dateArray)
          feedData = feedData.filter(d => 
                 d.methodOfFeed === ConstantProvider.typeDetailsIds.parenteralEnteral
              || d.methodOfFeed === ConstantProvider.typeDetailsIds.enteralOnly
              || d.methodOfFeed === ConstantProvider.typeDetailsIds.enteralOral)

          feedData = new OrderByTimeAscPipe().transform(feedData, null);

          if(feedData.length > 0) {
            let dateOfFeed;
            let timeOfFeed;

            // let firstEnteralFeedData = feedData.find(d => )
            dateOfFeed = feedData[0].dateOfFeed;
            timeOfFeed = feedData[0].timeOfFeed;

            let a = deliveryDate.split('-')
            let b = deliveryTime.split(':')
            let dateOfA = new Date(+a[2], +a[1]-1, +a[0], +b[0], +b[1])

            let c = dateOfFeed.split('-')
            let d = timeOfFeed.split(':')
            let dateOfB = new Date(+c[2], +c[1]-1, +c[0], +d[0], +d[1])

            let noOfDay = dateOfB.getTime() - dateOfA.getTime()
            let minutes = ((noOfDay / (1000*60)) % 60);
            let hours   = parseInt((noOfDay / (1000*60*60)).toString());

            //Calculating composition of first enteral feed.
            let compositionOfFirstEf = '';
            if(feedData[0].ommVolume)
              compositionOfFirstEf += 'OMM, '
            if(feedData[0].dhmVolume)
              compositionOfFirstEf += 'DHM, '
            if(feedData[0].formulaVolume)
              compositionOfFirstEf += 'Formula, '
            if(feedData[0].animalMilkVolume)
              compositionOfFirstEf += 'Animal Milk, '
            if(feedData[0].otherVolume)
              compositionOfFirstEf += 'Other, '

            result.timeTillFirstEnteralFeed = hours+":"+minutes,
            result.compositionOfFirstEnteralFeed = 
              compositionOfFirstEf.slice(0, compositionOfFirstEf.length-2),
              
            resolve(result)
          }else{
            resolve(result)
          }
        }else{
          resolve()
        }
      })

    })
    return promise
  }

  /**
   * This method finds out all the records of a particular baby where method of feed was breastfeed and
   * breastfeed was exclusive breastfeed.
   *
   * @author Naseem Akhtar (naseem@sdrc.co.in)
   * @param babyCode
   * @param dischargeDate
   */
  getHospitalDischargeDataForExclusiveBf(babyCode: string, dischargeDate: string): Promise<any> {
    let promise = new Promise<any>((resolve,reject)=>{
      this.storage.get(ConstantProvider.dbKeyNames.feedExpressions)
        .then(data=>{
          let bfCount = 0;
          let hospitalDishcargeStatus = null;
          let feedArray = data === null ? [] : (data as IFeed[]).filter(d => d.babyCode === babyCode
            && d.methodOfFeed != null)
          let partialFlag = false

          if(feedArray.length > 0){
            feedArray.forEach(d => {
              if(d.methodOfFeed === ConstantProvider.typeDetailsIds.logFeedBreastFeed)
                bfCount++
              else{
                let sum = Number(d.animalMilkVolume) + Number(d.dhmVolume) + Number(d.formulaVolume) +
                  Number(d.ommVolume) + Number(d.otherVolume)
                if(Number(d.ommVolume) > 0){
                  if(sum === Number(d.ommVolume))
                    bfCount++
                  else
                    partialFlag = true
                }
              }
            })
            if(bfCount === feedArray.length)
              hospitalDishcargeStatus = 'Exclusive'
            else{
              if(bfCount > 0 || partialFlag)
                hospitalDishcargeStatus = 'Partial'
              else
                hospitalDishcargeStatus = 'None'
            }
          }
          resolve(hospitalDishcargeStatus)
      }).catch(error => this.messageService.showErrorToast(error))
    })
    return promise
  }

  /**
   * @author Naseem Akhtar
   * @param bfExpressions 
   * @param babyCode 
   * @param date 
   * 
   * This method will be used to save multiple entries at once.
   */
  saveMultipleBfExpressions(feedExpressions: IFeed[], babyCode: string, date: string): Promise<any> {
    let promise = new Promise((resolve, reject) => {
      this.storage.get(ConstantProvider.dbKeyNames.feedExpressions)
      .then( data => {
        this.pppServiceProvider.deleteSpsRecord(babyCode)
        if(data != null && data.length > 0 && data.filter(d => d.babyCode === babyCode 
          && d.dateOfFeed === date).length > 0) {
          let validatedExpressions = this.validateMultipleExpressions(data, feedExpressions, babyCode, date)
          this.storage.set(ConstantProvider.dbKeyNames.feedExpressions, validatedExpressions)
          .then( d => resolve() )
          .catch( error => reject(error.message) )
        }else {
          data = data === null ? [] : data
          feedExpressions = this.setUpdatedDateAndUuidInExpressions(feedExpressions)
          data.push(...feedExpressions)
          this.storage.set(ConstantProvider.dbKeyNames.feedExpressions, data)
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
  setUpdatedDateAndUuidInExpressions(feedExpressions: IFeed[]) {
    feedExpressions.forEach(feedExpression => {
      feedExpression.createdDate = feedExpression.createdDate != null ? feedExpression.createdDate :
        this.datePipe.transform(new Date(), 'yyyy-MM-dd HH:mm:ss')
      feedExpression.updatedDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd HH:mm:ss')
      feedExpression.uuidNumber = this.utilService.getUuid()
    })

    return feedExpressions
  }

  /**
   * @author - Naseem Akhtar
   * @param dbExpressions - expressions of all baby present in the DB
   * @param expressionsToBeSaved - multiple expressions that needs to be saved
   * @param babyCode
   * @param date - date for which multiple entries have come.
   * 
   * This method will be used to validate multiple records for save all functionality.
   * All records for a particular date and baby is removed from the DB and then the records
   * received by @param expressionsToBeSaved are pushed to the expression array.
   */
  validateMultipleExpressions(dbExpressions: IFeed[], expressionsToBeSaved: IFeed[],
    babyCode: string, date: string) {

    let recordsToRemoveIndex: number[] = []
    for (let dbIndex = 0; dbIndex < dbExpressions.length; dbIndex++) {
      for (let index = 0; index < expressionsToBeSaved.length; index++) {
        // if(dbExpressions[dbIndex].babyCode === babyCode && dbExpressions[dbIndex].dateOfFeed === date
        //   && expressionsToBeSaved[index].dateOfFeed === date
        //   && dbExpressions[dbIndex].timeOfFeed === expressionsToBeSaved[index].timeOfFeed)
        if(dbExpressions[dbIndex].id === expressionsToBeSaved[index].id)
          recordsToRemoveIndex.push(dbIndex)
      }
    }

    recordsToRemoveIndex.reverse()
    recordsToRemoveIndex.forEach( index => dbExpressions.splice(index, 1) )
    expressionsToBeSaved = this.setUpdatedDateAndUuidInExpressions(expressionsToBeSaved)
    dbExpressions.push(...expressionsToBeSaved)

    return dbExpressions
  }

  /**
   * @author Naseem Akhtar
   * @param feedExpressions 
   * @param count 
   * @param babyCode 
   * @param date 
   * 
   * This method will check the length of the expressions array and will adjust the 
   * array to always display 8 records at minimum.
   */
  async defaultDisplayOfEntries(feedExpressions: IFeed[], count: number, babyCode: string, date: string) {
    for (let index = 0; index < count; index++) {
      feedExpressions.push(await this.getNewFeedExpressionEntry(babyCode, date))
    }
    return feedExpressions
  }

  async getNewFeedExpressionEntry(babyCode: string, date: string) {
    //The blank feed object
    let feed: IFeed = {
      id: null,
      babyCode: babyCode,
      userId: this.userService.getUser().email,
      babyWeight: null,
      dateOfFeed: date,
      dhmVolume: null,
      formulaVolume: null,
      animalMilkVolume: null,
      methodOfFeed: null,
      ommVolume: null,
      otherVolume: null,
      timeOfFeed: null,
      isSynced: false,
      locationOfFeeding: null,
      syncFailureMessage: null,
      createdDate: null,
      updatedDate: null,
      uuidNumber: null
    }

    await setTimeout( () => feed.id = this.getNewFeedExpressionId(babyCode))
    return feed
  }

}
