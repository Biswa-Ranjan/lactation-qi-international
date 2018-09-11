import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { ConstantProvider } from '../constant/constant';
import { DatePipe } from '@angular/common';
import { UserServiceProvider } from '../user-service/user-service';

/**
 * This service will help BFSPList component in DB operations.
 * @author Naseem Akhtar
 * @since 0.0.1
 */

@Injectable()
export class BfspDateListServiceProvider {

  constructor(public http: HttpClient, private storage: Storage, private datePipe: DatePipe,
    private userService: UserServiceProvider) {
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

    let dateLists: IDateList[] = [];
    try {
      let patient: IPatient = (await this.storage.get(ConstantProvider.dbKeyNames.patients) as IPatient[]).filter(d => d.babyCode === babyCode)[0]
      let onlyDateList: string[] = this.getDateList(patient.deliveryDate, patient.dischargeDate)

      //Can not do database call inside for loop so, doint it above the for loop
      let bfsps: IBFSP[] = (await this.storage.get(ConstantProvider.dbKeyNames.bfsps) as IBFSP[])
      
      //We have to check for null, because when there is no epression record, database returns null
      if(bfsps != null){
        bfsps = bfsps.filter(d => d.babyCode === patient.babyCode) 
      }

      for(let i = 0; i < onlyDateList.length;i++){

        //checking expression in this particular date
        let noExpressionOccured: boolean = false
        let bfspsLocal: IBFSP[] = []
        if(bfsps != null){
          bfspsLocal = bfsps.filter(d => d.dateOfBFSP === onlyDateList[i])
          if(bfspsLocal.length === 1){
            noExpressionOccured = bfspsLocal[0].noExpressionOccured
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
      let bfsps: IBFSP[] = (await this.storage.get(ConstantProvider.dbKeyNames.bfsps) as IBFSP[]).filter(d => d.babyCode === babyCode && d.dateOfBFSP === dateList.date && d.noExpressionOccured === true)
      if(bfsps.length != 1){
        //Was not seleted before
        return {result: false, value: true, message: 'It was not no expression occured before.'}                
      }else{
        bfsps = (await this.storage.get(ConstantProvider.dbKeyNames.bfsps) as IBFSP[]).filter(d => d.id != bfsps[0].id)
        await this.storage.set(ConstantProvider.dbKeyNames.bfsps, bfsps)
        return {result: true, value: null,message: ''}
      }

      

    }else{
      
      //Will try to set no expression true
      let bfsps: IBFSP[] = (await this.storage.get(ConstantProvider.dbKeyNames.bfsps) as IBFSP[])
      if(bfsps != null){
        bfsps = bfsps.filter(d => d.babyCode === babyCode && d.dateOfBFSP === dateList.date)
      }
      
      if(bfsps === undefined || bfsps == null || (bfsps != null && bfsps.length < 1)){

        //Why bfExpressions < 1? when the length is 1 or greater, it can not come to this place

        let bfsp:IBFSP = this.getNewBfExpressionEntry(babyCode, dateList.date)
        bfsp.id = this.getNewBfspId(babyCode)
        bfsp.noExpressionOccured = true
        let bfsps: IBFSP[] = await this.storage.get(ConstantProvider.dbKeyNames.bfsps)
        bfsps = bfsps == null?[]:bfsps        
        bfsps.push(bfsp)
        await this.storage.set(ConstantProvider.dbKeyNames.bfsps, bfsps)
        return {result: true, value: null,message: ''}
      }else{
        return {result: false, value: false, message: 'Can not put No supportive practice occured, supportive practice already exists for this date.'}        
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
  getNewBfspId(babyCode: string): string {
    return babyCode + "bfsp" + this.datePipe.transform(new Date(), 'ddMMyyyyHHmmssSSS');
  }


  getNewBfExpressionEntry(babyCode: string, date: string): IBFSP{

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
      uuidNumber: null,
      noExpressionOccured: false
    }

    return bf
  }

}
