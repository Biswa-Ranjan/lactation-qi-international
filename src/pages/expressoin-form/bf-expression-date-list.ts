import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { MessageProvider } from '../../providers/message/message';
import { BFExpressionDateListProvider } from '../../providers/bf-expression-date-list-service/bf-expression-date-list-service';
import { ConstantProvider } from '../../providers/constant/constant';

/**
 * @author Naseem Akhtar (naseem@sdrc.co.in)
 * @since 0.0.1
 * 
 * This component is used to display all the bf expression records of selected baby in date wise order.
 */

@IonicPage()
@Component({
  selector: 'page-expressoin-form',
  templateUrl: 'bf-expression-date-list.html',
})
export class BFExpressionDateListPage {

  babyCode: any;
  form: any;
  items: any;
  expBfDateListData: IDateList[] = [];
  
  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private bfExpressionDateListService: BFExpressionDateListProvider,
    private messageService: MessageProvider, private alertCtrl: AlertController) {
  }

  /**
   * Inside this function we are going to write the fetch expression list code.
   * Because init is called onnly while page creation, that is the reason for the
   * list not getting updated while coming back from the form.
   * @author - Naseem Akhtar
   * @since - 0.0.1
   */
  ionViewWillEnter(){
    this.babyCode = this.navParams.get('babyCode')
    this.getDateList()     
  }


  /**
   *This method is going to get the date list array
   * @author Ratikanta
   * @memberof BFExpressionDateListPage
   */
  async getDateList(){
    //Getting date list
    try{
      let data = await this.bfExpressionDateListService.getExpressionBFDateListData(this.babyCode)      
      this.expBfDateListData = data
    }catch(err){
      this.expBfDateListData=[]
      this.messageService.showErrorAlert(err)
    }
    
  }

    /**
   * This is going to send us to entry page with selected date and baby id
   * @author Ratikanta
   * @param date The selected date
   * @since 0.0.1
   */
  dateSelected(index: number){

    if(!this.expBfDateListData[index].noExpressionOccured){
      let date: string = this.expBfDateListData[index].date
      if(index > ConstantProvider.expressionAutoPopulateDateMaxNumber){
        this.showAfterMaxDayAccessAlert(date, index)
      }else{
        this.goToNextPage(date, false)
      }
    }else{      
      this.messageService.showErrorToast("No expression occured in this day, please uncheck to enter expressions.")
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
   * @memberof BFExpressionDateListPage
   * @since 2.3.0
   */
  async noExpressionOccured(index: number){
    this.messageService.showLoader("Please wait...")
    try{
      
      let data = await this.bfExpressionDateListService.noExpressionOccured(this.expBfDateListData[index], this.babyCode) 
      await this.getDateList()
      this.messageService.stopLoader()
      if(!data.result){
        this.expBfDateListData[index].noExpressionOccured = data.value
        this.messageService.showErrorAlert(data.message)
      }
        
    }catch(err){
      this.messageService.stopLoader()
      this.messageService.showErrorAlert(err)      
    }
  }

  /**
   * This method will take the control to next page which is expression details of selected date
   * @author Ratikanta
   * @param {string} date the selected date for which we will se the expression details
   * @param {boolean} isNewExpression if it is a new expression, the value will be true otherwise false
   * @memberof BFExpressionDateListPage
   * @since 2.3.0
   */
  goToNextPage(date: string, isNewExpression: boolean){
    let dataForBFEntryPage: IDataForBFEntryPage = {
      babyCode: this.babyCode,
      selectedDate: date,
      isNewExpression: isNewExpression,
      deliveryDate: this.navParams.data.deliveryDate,
      deliveryTime: this.navParams.data.deliveryTime,
      dischargeDate: this.navParams.data.dischargeDate
    }
    this.navCtrl.push('ExpressionTimeFormPage', {dataForBFEntryPage: dataForBFEntryPage})
  }

  /**
   * This method will show a confirm alert whether user wants to do data entry after certain days of 
   * delivery date
   * @author Ratikanta
   * @param {string} date the selected date for which we will se the expression details
   * @param {number} dayNumber The day to which the user selected for data entry
   * @memberof BFExpressionDateListPage
   * @since 2.3.0
   */
  showAfterMaxDayAccessAlert(date: string, dayNumber: number){
    const confirm = this.alertCtrl.create(
      
      {
        title: 'Warning',
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


  

}
