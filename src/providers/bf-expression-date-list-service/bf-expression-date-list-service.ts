import {
  HttpClient
} from '@angular/common/http';
import {
  Injectable
} from '@angular/core';
import {
  Storage
} from '@ionic/storage';
import {
  ConstantProvider
} from '../constant/constant';
import {
  UserServiceProvider
} from '../user-service/user-service';
import { DatePipe } from '@angular/common';

/**
 * @author - Subhadarshani
 * @since - 0.0.1
 * 
 * This service will help in fetching all the dates for which the breastfeed expressions are
 * present for the selected baby.
 */

@Injectable()
export class BFExpressionDateListProvider {

  constructor(public http: HttpClient, private storage: Storage,
    private userService: UserServiceProvider, private datePipe: DatePipe) {}
  /**
   * This method will give us all the dates in string array from delivery date to current date.
   * If baby is discharged between delivery date and current date, the string array with contain 
   * dates from delivery dates to discharge date.
   * @author Subhadarshani
   * @author Ratikanta
   * @since 0.0.1
   * @returns Promise<string[]> string array of dates
   * @param babyid the patient id for which we are extracting data
   */
  async getExpressionBFDateListData(babyCode: string) {

    let dateLists: IDateList[] = [];

    try {


      let patient: IPatient = (await this.storage.get(ConstantProvider.dbKeyNames.patients) as IPatient[]).filter(d => d.babyCode === babyCode)[0];  
      let onlyDateList: string[] = this.getDateList(patient.deliveryDate, patient.dischargeDate) 


      //Can not do database call inside for loop so, doint it above the for loop
      let bfExpressions: IBFExpression[] = (await this.storage.get(ConstantProvider.dbKeyNames.bfExpressions) as IBFExpression[])
      
      //We have to check for null, because when there is no epression record, database returns null
      if(bfExpressions != null){
        bfExpressions = bfExpressions.filter(d => d.babyCode === patient.babyCode) 
      }

      for(let i = 0; i < onlyDateList.length;i++){

        //checking expression in this particular date
        
        let noExpressionOccured: boolean = false
        let bfExpressionsLocal: IBFExpression[] = []
        if(bfExpressions != null){
          bfExpressionsLocal = bfExpressions.filter(d => d.dateOfExpression === onlyDateList[i])
          if(bfExpressionsLocal.length === 1){
            noExpressionOccured = bfExpressionsLocal[0].noExpressionOccured
          }
          //There is no else part to this if, because if we have multiple expression in a date, noExpressionOccured can not be true

        }
        
        let dateList: IDateList = {
          date: onlyDateList[i],
          noExpressionOccured: noExpressionOccured
        }        

        dateLists.push(dateList)

      }

      return dateLists

    } catch (err) {
      throw new Error ("Error while fetching data: " + err.message)
    }
  }

  /**
   * This method will give us all the expressionBF list  array format of the selected date.
   * @author Subhadarshani
   * @since 0.0.1
   * @returns Promise<any[]>  array of dates
   * @param babyid the patient id for which we are extracting data
   */
  findByBabyCodeAndDate(babyCode: string, date: string, isNewExpression: boolean): Promise < IBFExpression[] > {

    let promise: Promise < IBFExpression[] > = new Promise((resolve, reject) => {
      if (date !== null) {
        this.storage.get(ConstantProvider.dbKeyNames.bfExpressions)
          .then(data => {
            if (data != null) {
              data = (data as IBFExpression[]).filter(d => d.babyCode === babyCode && d.dateOfExpression === date);
              if ((data as IBFExpression[]).length > 0) {
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
      } else {
        resolve(this.defaultDisplayOfEntries([], ConstantProvider.noOfRecordsByDefault, babyCode, date))
      }
    });
    return promise;
  }

  /**
   * This method is going to append a new BfExpression object to existing list
   *
   * @param {IBFExpression[]} data The existing list
   * @param {string} babyCode The unique baby code
   * @param {date} The date of feeding
   * @returns {IBFExpression[]} The final appended list
   * @memberof ExpressionBfDateProvider
   */
  appendNewRecordAndReturn(data: IBFExpression[], babyCode: string, count: number, date ? : string): IBFExpression[] {

    //The blank feed object
    if (data === null) {
      data = []
    } else {
      for (let index = 0; index < count; index++) {
        data.push(this.getNewBfExpressionEntry(babyCode, date))
      }
    }

    return data
  }

  getNewBfExpressionEntry(babyCode: string, date: string) {
    let bf: IBFExpression = {
      id: null,
      babyCode: babyCode,
      userId: this.userService.getUser().email,
      dateOfExpression: date,
      timeOfExpression: null,
      methodOfExpression: null,
      locationOfExpression: null,
      volOfMilkExpressedFromLR: null,
      isSynced: false,
      syncFailureMessage: null,
      createdDate: null,
      updatedDate: null,
      uuidNumber: null,
      methodOfExpressionOthers: null,
      noExpressionOccured: false
    }

    return bf;
  }

  defaultDisplayOfEntries(bfExpressions: IBFExpression[], count: number, babyCode: string, date: string) {
    for (let index = 0; index < count; index++) {
      bfExpressions.push(this.getNewBfExpressionEntry(babyCode, date))
    }
    return bfExpressions
  }



  /**
   * This method is going to return array of dates(dd-MM-yyyy)
   * @author Ratikanta
   * @param {Date} deliveryDate Delivery date of the patient
   * @param {Date} dischargeDate Discharge date of the patient
   * @returns {string[]} Array of dates 
   * @memberof BFExpressionDateListProvider
   * @since 2.3.0
   */
  private getDateList(deliveryDate: string, dischargeDate: string): string[] {

    let dateList: string[] = []
    let today: string = this.datePipe.transform(new Date(), 'dd-MM-yyyy')
    let startDate: any = new Date(deliveryDate.split('-')[1] + '-' + deliveryDate.split('-')[0] + '-' +deliveryDate.split('-')[2])
    let endDate: any = dischargeDate != null? new Date(dischargeDate.split('-')[1] + '-' + dischargeDate.split('-')[0] + '-' +dischargeDate.split('-')[2]) : new Date(today.split('-')[1] + '-' + today.split('-')[0] + '-' +today.split('-')[2])

    let differenceInDays:number = Math.round((endDate-startDate)/(1000*60*60*24))

    dateList.push(deliveryDate)
    for(let i = 1;i< differenceInDays;i++){
      let newDate: Date = new Date(deliveryDate.split('-')[1] + '-' + deliveryDate.split('-')[0] + '-' +deliveryDate.split('-')[2])
      dateList.push(this.datePipe.transform(newDate.setDate(newDate.getDate() + i), 'dd-MM-yyyy')) 
    }

    if(differenceInDays > 0)
      dateList.push(this.datePipe.transform(endDate, 'dd-MM-yyyy'))    
    
    return dateList
  }

  /**
   *This method will get executed when user try to check/ uncheck no expression occured for the day
   * @author Ratikanta
   * @param {IDateList} dateList
   * @param {string} babyCode
   * @memberof BFExpressionDateListProvider
   */
  async noExpressionOccured(dateList: IDateList, babyCode: string){

    if(dateList.noExpressionOccured){
      

      //Will try to set no expression false
      let bfExpressions: IBFExpression[] = (await this.storage.get(ConstantProvider.dbKeyNames.bfExpressions) as IBFExpression[]).filter(d => d.babyCode === babyCode && d.dateOfExpression === dateList.date && d.noExpressionOccured === true)
      if(bfExpressions.length != 1){
        //Was not seleted before
        return {result: false, value: true, message: 'It was not no expression occured before.'}                
      }else{
        bfExpressions = (await this.storage.get(ConstantProvider.dbKeyNames.bfExpressions) as IBFExpression[]).filter(d => d.id != bfExpressions[0].id)
        await this.storage.set(ConstantProvider.dbKeyNames.bfExpressions, bfExpressions)
        return {result: true, value: null,message: ''}
      }

      

    } else {
      
      
      //Will try to set no expression true
      let bfExpressions: IBFExpression[] = (await this.storage.get(ConstantProvider.dbKeyNames.bfExpressions) as IBFExpression[])
      if(bfExpressions != null){
        bfExpressions = bfExpressions.filter(d => d.babyCode === babyCode && d.dateOfExpression === dateList.date)
      }
      if(bfExpressions === undefined || bfExpressions == null || (bfExpressions != null && bfExpressions.length < 1)){

        //Why bfExpressions < 1? when the length is 1 or greater, it can not come to this place

        let bfExpression:IBFExpression = this.getNewBfExpressionEntry(babyCode, dateList.date)
        bfExpression.id = this.getNewBfExpressionId(babyCode)
        bfExpression.noExpressionOccured = true
        let bfExpressions: IBFExpression[] = await this.storage.get(ConstantProvider.dbKeyNames.bfExpressions)
        bfExpressions = bfExpressions == null?[]:bfExpressions          
        bfExpressions.push(bfExpression)
        await this.storage.set(ConstantProvider.dbKeyNames.bfExpressions, bfExpressions)
        return {result: true, value: null,message: ''}
      } 
      else{
        return {result: false, value: false, message: 'Can not put No expression occured, expression already exists for this date.'}        
      }

    }
    
  }


  /**
   * This method is going to give us a new BF expression id
   *
   * @param {string} babyCode This is the baby code for which we are creating the bf expression id
   * @returns {string} The new bf expression id
   * @memberof BFExpressionDateListProvider
   * @author Ratikanta
   * @since 2.3.0
   */
  getNewBfExpressionId(babyCode: string): string{
    return babyCode + "bfid" + this.datePipe.transform(new Date(), 'ddMMyyyyHHmmssSSS');
  }
}
