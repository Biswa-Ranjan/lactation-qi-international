import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { DatePipe } from '@angular/common';
import { ConstantProvider } from '../constant/constant';
import { UserServiceProvider } from '../user-service/user-service';


/**
 * This service will help FeedDateList component
 * @author Ratikanta
 * @since 0.0.1
 */
@Injectable()
export class FeedDateListServiceProvider {

  constructor(private storage: Storage, private datePipe: DatePipe, private userService: UserServiceProvider) {}

  /**
   * This method will give us all the dates in string array format of which feed expression we have.
   * @author Ratikanta
   * @since 0.0.1
   * @returns Promise<string[]> string array of dates
   * @param patientId the patient id for which we are extracting data
   */
  async getFeedDateListData(babyCode: string) {

    let dateLists: IDateList[] = [];
    try {
      let patient: IPatient = (await this.storage.get(ConstantProvider.dbKeyNames.patients) as IPatient[]).filter(d => d.babyCode === babyCode)[0]  
      let onlyDateList: string[] = this.getDateList(patient.deliveryDate, patient.dischargeDate)

      //Can not do database call inside for loop so, doint it above the for loop
      let feeds: IFeed[] = (await this.storage.get(ConstantProvider.dbKeyNames.feedExpressions) as IFeed[])
      
      //We have to check for null, because when there is no epression record, database returns null
      if(feeds != null){
        feeds = feeds.filter(d => d.babyCode === patient.babyCode) 
      }

      for(let i = 0; i < onlyDateList.length;i++){

        //checking expression in this particular date

        let noExpressionOccured: boolean = false
        let feedsLocal: IFeed[] = []

        if(feeds != null){
          feedsLocal = feeds.filter(d => d.dateOfFeed === onlyDateList[i])
          if(feedsLocal.length === 1){
            noExpressionOccured = feedsLocal[0].noExpressionOccured
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
      let feeds: IFeed[] = (await this.storage.get(ConstantProvider.dbKeyNames.feedExpressions) as IFeed[]).filter(d => d.babyCode === babyCode && d.dateOfFeed === dateList.date && d.noExpressionOccured === true)
      if(feeds.length != 1){
        //Was not seleted before
        return {result: false, value: true, message: 'It was not no expression occured before.'}                
      }else{
        feeds = (await this.storage.get(ConstantProvider.dbKeyNames.feedExpressions) as IFeed[]).filter(d => d.id != feeds[0].id)
        await this.storage.set(ConstantProvider.dbKeyNames.feedExpressions, feeds)
        return {result: true, value: null,message: ''}
      }

      

    }else{
      
      //Will try to set no expression true
      let feeds: IFeed[] = (await this.storage.get(ConstantProvider.dbKeyNames.feedExpressions) as IFeed[])
      if(feeds != null){
        feeds = feeds.filter(d => d.babyCode === babyCode && d.dateOfFeed === dateList.date)
      }
      
      if(feeds === undefined || feeds == null || (feeds != null && feeds.length < 1)){

        //Why bfExpressions < 1? when the length is 1 or greater, it can not come to this place
        
        let feed:IFeed = this.getNewFeedExpressionEntry(babyCode, dateList.date)
        feed.id = this.getNewFeedExpressionId(babyCode)
        feed.noExpressionOccured = true
        let feeds: IFeed[] = await this.storage.get(ConstantProvider.dbKeyNames.feedExpressions)
        feeds = feeds == null?[]:feeds
        feeds.push(feed)
        await this.storage.set(ConstantProvider.dbKeyNames.feedExpressions, feeds)
        return {result: true, value: null,message: ''}
      }else{
        return {result: false, value: false, message: 'Can not put No expression occured, expression already exists for this date.'}        
      }

    }
    
  }

  getNewFeedExpressionEntry(babyCode: string, date: string) {
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
      uuidNumber: null,
      noExpressionOccured: false
    }
    
    return feed
  }

  getNewFeedExpressionId(babyCode: string): string{
    return babyCode + "feid" + this.datePipe.transform(new Date(), 'ddMMyyyyHHmmssSSS');
  }

}
