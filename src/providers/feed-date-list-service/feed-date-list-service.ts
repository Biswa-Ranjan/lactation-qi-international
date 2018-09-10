import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { DatePipe } from '@angular/common';
import { ConstantProvider } from '../constant/constant';


/**
 * This service will help FeedDateList component
 * @author Ratikanta
 * @since 0.0.1
 */
@Injectable()
export class FeedDateListServiceProvider {

  constructor(private storage: Storage, private datePipe: DatePipe) {}

  /**
   * This method will give us all the dates in string array format of which feed expression we have.
   * @author Ratikanta
   * @since 0.0.1
   * @returns Promise<string[]> string array of dates
   * @param patientId the patient id for which we are extracting data
   */
  async getFeedDateListData(babyCode: string) {

    try {
      let patient: IPatient = (await this.storage.get(ConstantProvider.dbKeyNames.patients) as IPatient[])
                                .filter(d => d.babyCode === babyCode)[0]  
                                                              
      return this.getDateList(patient.deliveryDate, patient.dischargeDate)

    } catch (err) {
      return err.message
    }
    
  }

  /**
   * This method is going to return array of dates(dd-MM-yyyy)
   * @author Ratikanta
   * @param {Date} deliveryDate Delivery date of the patient
   * @param {Date} dischargeDate Discharge date of the patient
   * @returns {string[]} Array of dates 
   * @memberof FeedDateListServiceProvider
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

}
