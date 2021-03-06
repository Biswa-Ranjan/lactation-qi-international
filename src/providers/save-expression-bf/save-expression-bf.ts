import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { ConstantProvider } from '../constant/constant';
import { DatePipe } from '@angular/common';
import { PppServiceProvider } from '../ppp-service/ppp-service';
import { UtilServiceProvider } from '../util-service/util-service';
import { LactationProvider } from '../lactation/lactation';
import { OrderByTimeExpressionFormAscPipe } from '../../pipes/order-by-time-expression-form-asc/order-by-time-expression-form-asc';

/**
 *
 * @author Ratikanta
 * @since 0.0.1
 * @export
 * @class SaveExpressionBfProvider
 */
@Injectable()
export class SaveExpressionBfProvider {

  isWeb : boolean = false;
  constructor(public http: HttpClient, private storage: Storage, private datePipe: DatePipe,
    private pppServiceProvider : PppServiceProvider, private utilService: UtilServiceProvider,
    private lactationPlatform: LactationProvider) {
      this.isWeb = this.lactationPlatform.getPlatform().isWebPWA
  }

  /**
   * This method is going to give us a new BF expression id
   *
   * @param {string} babyCode This is the baby code for which we are creating the bf expression id
   * @returns {string} The new bf expression id
   * @memberof ExpressionBfDateProvider
   * @author Subhadarshani
   * @since 0.0.1
   */
  getNewBfExpressionId(babyCode: string): string{
    return babyCode + "bfid" + this.datePipe.transform(new Date(), 'ddMMyyyyHHmmssSSS');
  }

  /**
   * This method will save the BF expression in local storage.
   * @author Subhadarshani
   * @since 0.0.1
   * @returns Promise<string[]> string array of dates
   * @param babyid the patient id for which we are saving data
   * @author - Naseem Akhtar
   */
  saveBfExpression(bfExpression: IBFExpression, newData: boolean): Promise<any>{
    let promise = new Promise((resolve, reject) => {
      bfExpression.isSynced = false;
      bfExpression.createdDate = bfExpression.createdDate === null ?
        this.datePipe.transform(new Date(), 'yyyy-MM-dd HH:mm:ss') : bfExpression.createdDate;
      bfExpression.updatedDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd HH:mm:ss');
      bfExpression.uuidNumber = this.utilService.getUuid();
      this.storage.get(ConstantProvider.dbKeyNames.bfExpressions)
      .then((val) => {
        let bfExpressions: IBFExpression[] = [];
        this.pppServiceProvider.deleteSpsRecord(bfExpression.babyCode)
        if(val != null && val.length > 0) {
          bfExpressions = val;

          let index = bfExpressions.findIndex(d=>d.id === bfExpression.id)

          if(index < 0) {
            bfExpression.id = this.getNewBfExpressionId(bfExpression.babyCode)
            bfExpressions.push(bfExpression)
            this.storage.set(ConstantProvider.dbKeyNames.bfExpressions, bfExpressions)
              .then(()=> {
                resolve()
              })
              .catch(err=> {
                reject(err.message)
              })
          }else {
            if(!newData) {
              bfExpressions.splice(index, 1, bfExpression)
              this.storage.set(ConstantProvider.dbKeyNames.bfExpressions, bfExpressions)
              .then(() => {
                resolve()
              })
              .catch(err=>{
                reject(err.message);
              })
            }else
              reject(ConstantProvider.messages.duplicateTime);
          }
        }else {
          bfExpression.id = this.getNewBfExpressionId(bfExpression.babyCode)
          bfExpressions.push(bfExpression)
          this.storage.set(ConstantProvider.dbKeyNames.bfExpressions, bfExpressions)
          .then(()=>{
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
   * This method will delete a expression
   * @author Ratikanta
   * @since 0.0.1
   * @param {string} id
   * @returns {Promise<any>}
   * @memberof SaveExpressionBfProvider
   */
  delete(id: string): Promise<any>{
    let promise =  new Promise((resolve, reject)=>{
      if(id != undefined && id != null) {
        this.storage.get(ConstantProvider.dbKeyNames.bfExpressions)
        .then(data=>{
          let index = (data as IBFExpression[]).findIndex(d=>d.id === id);
          if(index >= 0){
            this.pppServiceProvider.deleteSpsRecord(data[index].babyCode);
            (data as IBFExpression[]).splice(index, 1)
            this.storage.set(ConstantProvider.dbKeyNames.bfExpressions, data)
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
   * @author Naseem Akhtar
   * @param bfExpressions 
   * @param babyCode 
   * @param date 
   * 
   * This method will be used to save multiple entries at once.
   */
  saveMultipleBfExpressions(bfExpressions: IBFExpression[], babyCode: string, date: string): Promise<any> {
    let promise = new Promise((resolve, reject) => {
      this.storage.get(ConstantProvider.dbKeyNames.bfExpressions)
      .then( data => {
        this.pppServiceProvider.deleteSpsRecord(babyCode)
        if(data != null && data.length > 0 && data.filter(d => d.babyCode === babyCode 
          && d.dateOfExpression === date).length > 0) {
          let validatedExpressions = this.validateMultipleExpressions(data, bfExpressions, babyCode, date)
          this.storage.set(ConstantProvider.dbKeyNames.bfExpressions, validatedExpressions)
          .then( d => resolve() )
          .catch( error => reject(error.message) )
        }else {
          data = data === null ? [] : data
          bfExpressions = this.setUpdatedDateAndUuidInExpressions(bfExpressions)
          data.push(...bfExpressions)
          this.storage.set(ConstantProvider.dbKeyNames.bfExpressions, data)
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
  setUpdatedDateAndUuidInExpressions(bfExpressions: IBFExpression[]) {
    bfExpressions.forEach(bfExpression => {
      bfExpression.createdDate = bfExpression.createdDate != null ? bfExpression.createdDate :
        this.datePipe.transform(new Date(), 'yyyy-MM-dd HH:mm:ss')
      bfExpression.updatedDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd HH:mm:ss')
      bfExpression.uuidNumber = this.utilService.getUuid()
    })

    return bfExpressions
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
  validateMultipleExpressions(dbExpressions: IBFExpression[], expressionsToBeSaved: IBFExpression[],
    babyCode: string, date: string) {

    let recordsToRemoveIndex: number[] = []
    for (let dbIndex = 0; dbIndex < dbExpressions.length; dbIndex++) {
      for (let index = 0; index < expressionsToBeSaved.length; index++) {
        // if(dbExpressions[dbIndex].babyCode === babyCode && dbExpressions[dbIndex].dateOfExpression === date
        //   && expressionsToBeSaved[index].dateOfExpression === date
        //   && dbExpressions[dbIndex].timeOfExpression === expressionsToBeSaved[index].timeOfExpression)
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

  getTimeTillFirstExpression(babyCode: string, deliveryDate: string, deliveryTime: string): Promise<any> {
    let promise = new Promise((resolve, reject) => {
      this.storage.get(ConstantProvider.dbKeyNames.bfExpressions)
        .then(data => {
          if(data) {
            let bfExpressions = (data as IBFExpression[]).filter(d => d.babyCode === babyCode)
            if(bfExpressions.length > 0) {
              bfExpressions = new OrderByTimeExpressionFormAscPipe().transform(bfExpressions, null)

              let splitDeliveryDate = deliveryDate.split('-')
              let splitDeliveryTime = deliveryTime.split(':')
              let deliveryDateTime = new Date(+splitDeliveryDate[2], +splitDeliveryDate[1]-1, 
                +splitDeliveryDate[0], +splitDeliveryTime[0], +splitDeliveryTime[1])

              let splitDateOfExpression = bfExpressions[0].dateOfExpression.split('-')
              let splitTimeOfExpression = bfExpressions[0].timeOfExpression.split(':')
              let dateTimeOfExpression = new Date(+splitDateOfExpression[2], +splitDateOfExpression[1]-1, 
                +splitDateOfExpression[0], +splitTimeOfExpression[0], +splitTimeOfExpression[1])
              
              let noOfDay = dateTimeOfExpression.getTime() - deliveryDateTime.getTime()
              let minutes = ((noOfDay / (1000*60)) % 60);
              let hours   = parseInt((noOfDay / (1000*60*60)).toString());

              let timeTillFirstExpression = null
              if(hours.toString().length === 1)
                timeTillFirstExpression = '0' + hours
              else
                timeTillFirstExpression = hours

              if(minutes.toString().length === 1)
                timeTillFirstExpression += ':0' + minutes
              else
                timeTillFirstExpression += ':' + minutes

              resolve(timeTillFirstExpression)
            }else
              resolve(null)
          }else
            resolve(null)
        }, error => reject())
        .catch( error => reject())
    })
    return promise
  }
}
