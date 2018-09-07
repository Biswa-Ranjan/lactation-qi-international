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

    try {
      let patient: IPatient = (await this.storage.get(ConstantProvider.dbKeyNames.patients) as IPatient[])
                                .filter(d => d.babyCode === babyCode)[0]  
                                                              
      return this.getDateList(patient.deliveryDate, patient.dischargeDate)

    } catch (err) {
      return err.message
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

    // if(data != null){
    //   (data as IBFExpression[]).splice(0, 0, bf)
    // }else{
    //   data = [];
    //   data.push(bf)
    // }

    if (data === null) {
      data = []
    } else {
      for (let index = 0; index < count; index++) {
        data.push(this.getNewBfExpressionEntry(babyCode, date))
      }
    }
    // data.push(this.getNewBfExpressionEntry(babyCode, date))

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
      methodOfExpressionOthers: null
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
  getDateList(deliveryDate: string, dischargeDate: string): string[] {

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
}
