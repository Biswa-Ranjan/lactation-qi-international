import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { MessageProvider } from '../../providers/message/message';
import { BfspDateListServiceProvider } from '../../providers/bfsp-date-list-service/bfsp-date-list-service';
import { ConstantProvider } from '../../providers/constant/constant';

/**
 * @author Naseem Akhtar (naseem@sdr.co.in)
 * @since 0.0.1
 * 
 * This component is used to display all the bfsp records of selected baby in date wise order.
 */

@IonicPage()
@Component({
  selector: 'page-bf-supportive-practice-date-list',
  templateUrl: 'bf-supportive-practice-date-list.html',
})
export class BfSupportivePracticeDateListPage {

  babyCode:string;
  items: any;
  bfspDateListData: IDateList[] = [];
  dataForBfspPage: IDataForBfspPage

  constructor(public navCtrl: NavController, public navParams: NavParams,
    private bfspDateListService: BfspDateListServiceProvider, private messageService: MessageProvider, private alertCtrl: AlertController) {}

  /**
   * Inside this function we are going to write the fetch expression list code.
   * Because init is called only while page creation, that is the reason for the
   * list not getting updated while coming back from the form.
   * @author - Naseem Akhtar
   * @since - 0.0.1
   */
  ionViewWillEnter(){
    this.babyCode = this.navParams.data.babyCode;
    this.getDateList()

    this.dataForBfspPage = {
      babyCode: this.navParams.data.babyCode,
      selectedDate: null,
      isNewBfsp: true,
      deliveryDate: this.navParams.data.deliveryDate,
      deliveryTime: this.navParams.data.deliveryTime,
      dischargeDate: this.navParams.data.dischargeDate
    }
  }

  /**
   * This method is going to get the date list array
   * @author Ratikanta 
   * @memberof BfSupportivePracticeDateListPage
   */
  getDateList(){
    //Getting date list
    this.bfspDateListService.getBFSPDateList(this.babyCode)
      .then(data => {
        this.bfspDateListData = data;
      })
      .catch(err => {
        this.messageService.showErrorToast(err)
      })
  }


  /**
   * This is going to send us to entry page with selected date and baby id
   * @author Naseem Akhtar
   * @author Ratikanta
   * @param {number} index the selected date
   * @since 0.0.1
   */
  dateSelected(index: number) {

    if(!this.bfspDateListData[index].noExpressionOccured){
      let date: string = this.bfspDateListData[index].date
      if(index > ConstantProvider.expressionAutoPopulateDateMaxNumber){
        this.showAfterMaxDayAccessAlert(date, index)
      }else{
        this.goToNextPage(date, false)
      }    
    } else {      
      this.messageService.showErrorToast("No supportive practice occured in this day, please uncheck to enter supportive practice.")
    }
  };

  /**
   * This methodis going to take us to the entry modal
   * 
   * @memberof BfSupportivePracticeDateListPage
   * @author Naseem Akhtar
   * @since 0.0.1
  */
  newBFSP() {
    this.goToNextPage(null, true)
  };

  /**
   * This method is going to decide what will happen if user will check or uncheck the 
   * no expression occured checkbox
   * 
   * @author Ratikanta
   * @param {number} index
   * @memberof BfSupportivePracticeDateListPage
   * @since 2.3.0
   */
  async noExpressionOccured(index: number){
    this.messageService.showLoader("Please wait...")
    try{
      
      let data = await this.bfspDateListService.noExpressionOccured(this.bfspDateListData[index], this.babyCode) 
      await this.getDateList()
      this.messageService.stopLoader()
      if(!data.result){
        this.bfspDateListData[index].noExpressionOccured = data.value
        this.messageService.showErrorAlert(data.message)
      }
        
    }catch(err){
      this.messageService.stopLoader()
      this.messageService.showErrorAlert(err)
    }
  }


  /**
   * This method will show a confirm alert whether user wants to do data entry after certain days of 
   * delivery date
   * @author Ratikanta
   * @param {string} date the selected date for which we will se the expression details
   * @param {number} dayNumber The day to which the user selected for data entry
   * @memberof BfSupportivePracticeDateListPage
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


  /**
   * This method will take the control to next page which is expression details of selected date
   * @author Ratikanta
   * @param {string} date the selected date for which we will se the expression details
   * @param {boolean} isNewExpression if it is a new expression, the value will be true otherwise false
   * @memberof BfSupportivePracticeDateListPage
   * @since 2.3.0
   */
  goToNextPage(date: string, isNewExpression: boolean){
    if(isNewExpression){
      this.navCtrl.push('BfSupportivePracticePage', {dataForBfspPage: this.dataForBfspPage})
    }else{
      this.dataForBfspPage.selectedDate = date
      this.navCtrl.push('BfSupportivePracticePage', {dataForBfspPage: this.dataForBfspPage})
    }
  }

}
