import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { ConstantProvider } from '../constant/constant';
import { DatePipe } from '@angular/common';

/**
 * This service will help BFSPList component in DB operations.
 * @author Naseem Akhtar
 * @since 0.0.1
 */

@Injectable()
export class BfspDateListServiceProvider {

  constructor(public http: HttpClient, private storage: Storage, private datePipe: DatePipe) {
  }

  /**
   * This method will return a list of records for the selected baby and for the 
   * selected date.
   * 
   * After fetching all the records for the above mentioned condition, the dates are being
   * pushed into a Set for unique dates and then passed to bfsp-list component.
   * 
   * @author - Naseem Akhtar (naseem@sdrc.co.in)
   * @since - 0.0.1
   * @param babyCode 
   */
  async getBFSPDateList(babyCode: string) {
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
   * @memberof BfspDateListServiceProvider
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
