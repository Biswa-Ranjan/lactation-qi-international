import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { FeedDateListServiceProvider } from '../../providers/feed-date-list-service/feed-date-list-service';
import { MessageProvider } from '../../providers/message/message';
import { ConstantProvider } from '../../providers/constant/constant';

/**
 * This page/component will have entries of feed expression by date
 * 
 * @author Ratikanta
 * @since 0.0.1
 */
@IonicPage()
@Component({
  selector: 'page-feed-date-list',
  templateUrl: 'feed-date-list.html',
})
export class FeedDateListPage {

  feedDateListData: string[] = [];
  babyCode:string;
  params: Object;
  paramToExpressionPage: IParamToExpresssionPage;

  constructor(private feedDateListService: FeedDateListServiceProvider,
    private messageService: MessageProvider, private navCtrl: NavController,   
    private navParams: NavParams, private alertCtrl: AlertController) {}

  
  ionViewWillEnter(){

    this.paramToExpressionPage = {
      babyCode: this.navParams.get("babyCode"),
      deliveryDate: this.navParams.get('deliveryDate'),
      deliveryTime: this.navParams.get('deiveryTime')
    }

    this.babyCode = this.paramToExpressionPage.babyCode;
    

    //Getting date list
    this.feedDateListService.getFeedDateListData(this.paramToExpressionPage.babyCode)
    .then(data=>{
      this.feedDateListData = data
    })
    .catch(err=>{
      this.messageService.showErrorToast(err)
    })
  }

  /**
   * This is going to send us to entry page with selected date and baby id
   * @author Ratikanta
   * @param {number} index The selected date
   * @since 0.0.1
   */
  dateSelected(index: number){
    let date: string = this.feedDateListData[index]
    if(index > ConstantProvider.expressionAutoPopulateDateMaxNumber){
      this.showAfterMaxDayAccessAlert(date, index)
    }else{
      this.goToNextPage(date, false)
    }  
    
  }

/**
 * This methodis going to take us to the entry modal
 * 
 * @memberof FeedDateListPage
 * @author Ratikanta
 * @since 0.0.1
 */
  newExpression(){
    this.goToNextPage(null, true)
  }

  /**
   * This method is going to decide what will happen if user will check or uncheck the 
   * no expression occured checkbox
   * 
   * @author Ratikanta
   * @param {number} index
   * @memberof FeedDateListPage
   * @since 2.3.0
   */
  noExpressionOccured(index: number){
    alert("under construction")
  }


  /**
   * This method will show a confirm alert whether user wants to do data entry after certain days of 
   * delivery date
   * @author Ratikanta
   * @param {string} date the selected date for which we will se the expression details
   * @param {number} dayNumber The day to which the user selected for data entry
   * @memberof FeedDateListPage
   * @since 2.3.0
   */
  showAfterMaxDayAccessAlert(date: string, dayNumber: number){
    const confirm = this.alertCtrl.create(
      
      {
        title: 'Warning!',
        message: 'You have selected day ' + dayNumber + ', please make sure discharge date is correct.',
        buttons: 
        [
          {
            text: 'Ok',
            handler: ()=>{
              this.goToNextPage(date, false)         
            }
          }
        ]

      }
    )

    confirm.present()
  }


  /**
   * This method will take the control to next page which is expression details of selected date
   * @author Ratikanta
   * @param {string} date the selected date for which we will se the expression details
   * @param {boolean} isNewExpression if it is a new expression, the value will be true otherwise false
   * @memberof FeedDateListPage
   * @since 2.3.0
   */
  goToNextPage(date: string, isNewExpression: boolean){
    let dataForFeedEntryPage: IDataForFeedEntryPage = {
      babyCode: this.babyCode,
      selectedDate: date,
      isNewExpression: isNewExpression,
      deliveryDate: this.navParams.data.deliveryDate,
      deliveryTime: this.navParams.data.deliveryTime,
      dischargeDate: this.navParams.data.dischargeDate
    }    
    
    this.navCtrl.push('FeedPage', {dataForFeedEntryPage: dataForFeedEntryPage})
  }
}
