import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { ConstantProvider } from '../constant/constant';
import { DatePipe } from '@angular/common';
import { PppServiceProvider } from '../ppp-service/ppp-service';
import { UtilServiceProvider } from '../util-service/util-service';
import { LactationProvider } from '../lactation/lactation';

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
   * This method will give us all the save the BF expression in local storage.
   * @author Subhadarshani
   * @since 0.0.1
   * @returns Promise<string[]> string array of dates
   * @param babyid the patient id for which we are saving data
   * @author - Naseem Akhtar
   */
  saveBfExpression(bfExpression: IBFExpression, newData: boolean): Promise<any>{
    // if(existingDate != null && this.isWeb){
    //   existingDate = existingDate.substring(0,10)
    //   existingDate = existingDate.replace(/(\d*)-(\d*)-(\d*)/,'$3-$2-$1')
    // }
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
          let index = bfExpressions.findIndex(d=>d.babyCode === bfExpression.babyCode && d.dateOfExpression === bfExpression.dateOfExpression
              && d.timeOfExpression === bfExpression.timeOfExpression)

          if(index < 0) {
            // index = bfExpressions.findIndex(d=>d.babyCode === bfExpression.babyCode && d.dateOfExpression === existingDate
            //   && d.timeOfExpression === existingTime);
            bfExpression.id = this.getNewBfExpressionId(bfExpression.babyCode)
            bfExpressions.push(bfExpression)
            // bfExpressions = this.validateNewEntryAndUpdate(bfExpressions, bfExpression, index)
            this.storage.set(ConstantProvider.dbKeyNames.bfExpressions, bfExpressions)
              .then(data=> {
                resolve()
              })
              .catch(err=> {
                reject(err.message);
              })
          }else {
            if(!newData) {
              bfExpressions.splice(index, 1, bfExpression)
              // bfExpressions = this.validateNewEntryAndUpdate(bfExpressions, bfExpression, index)
              this.storage.set(ConstantProvider.dbKeyNames.bfExpressions, bfExpressions)
              .then(data => {
                resolve()
              })
              .catch(err=>{
                reject(err.message);
              })
            }else
              reject(ConstantProvider.messages.duplicateTime);
          }
        }else{
          bfExpression.id = this.getNewBfExpressionId(bfExpression.babyCode)
          bfExpressions.push(bfExpression)
          this.storage.set(ConstantProvider.dbKeyNames.bfExpressions, bfExpressions)
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
   * @author Subhadarshani
   * @since 0.0.1
   * @param bfExpressions All the existing bf expressions
   * @param bfExpression incoming bf expression
   * @returns IBFExpression[] modified bf expressions
   * @author - Naseem Akhtar
   */
  private validateNewEntryAndUpdate(bfExpressions: IBFExpression[], bfExpression: IBFExpression, index: number): IBFExpression[]{

    if(index < 0) {
      bfExpression.id = this.getNewBfExpressionId(bfExpression.babyCode);
    }else {
      bfExpressions.splice(index, 1);
    }

    bfExpressions.push(bfExpression)
    return bfExpressions;

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

  saveMultipleBfExpressions(bfExpressions: IBFExpression[], babyCode: string, date: string): Promise<any> {
    let promise = new Promise((resolve, reject) => {
      this.storage.get(ConstantProvider.dbKeyNames.bfExpressions)
      .then( data => {
        if(data != null && data.length > 0 && data.filter(d => d.babyCode === babyCode 
          && d.dateOfExpression === date).length > 0) {
          let validatedExpressions = this.validateMultipleExpressions(data, bfExpressions)
          this.storage.set(ConstantProvider.dbKeyNames.bfExpressions, validatedExpressions)
          .then( d => resolve() )
          .catch( error => reject(error.message) )
        }else {
          bfExpressions = this.setUpdatedDateAndUuidInExpressions(bfExpressions)
          this.storage.set(ConstantProvider.dbKeyNames.bfExpressions, bfExpressions)
          .then( d => resolve() )
          .catch( error => reject(error.message) )
        }
      })
    })
    return promise
  }

  setUpdatedDateAndUuidInExpressions(bfExpressions: IBFExpression[]) {
    bfExpressions.forEach(bfExpression => {
      bfExpression.updatedDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd HH:mm:ss');
      bfExpression.uuidNumber = this.utilService.getUuid();
    })

    return bfExpressions
  }

  validateMultipleExpressions(dbExpressions: IBFExpression[], expressionsToBeSaved: IBFExpression[]) {
    expressionsToBeSaved.forEach( exp => {
      let index = dbExpressions.findIndex( d => d.babyCode === exp.babyCode && 
        d.dateOfExpression === exp.dateOfExpression && d.timeOfExpression === exp.timeOfExpression)

      if(index >= 0) {
        dbExpressions.splice(index, 1)
      }
    })

    dbExpressions.push(...expressionsToBeSaved)

    return dbExpressions
  }
}
