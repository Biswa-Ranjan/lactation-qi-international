import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalController } from 'ionic-angular';
import { FormGroup, FormBuilder } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { BfSupportivePracticeServiceProvider } from '../../providers/bf-supportive-practice-service/bf-supportive-practice-service';
import { MessageProvider } from '../../providers/message/message';
import { ConstantProvider } from '../../providers/constant/constant';
import { DatePicker } from '@ionic-native/date-picker';
import { LactationProvider } from '../../providers/lactation/lactation';
import { DatePickerProvider, DatePickerOption } from 'ionic2-date-picker';

/**
 * This page will be used to enter the data of breast feeding supportive practice
 * for a particular baby.
 * @author - Naseem Akhtar
 * @since - 0.0.1
 */

@IonicPage()
@Component({
  selector: 'page-bf-supportive-practice',
  templateUrl: 'bf-supportive-practice.html',
})
export class BfSupportivePracticePage {

  supportivePracticeForm: FormGroup;
  forEdit: boolean;
  autoBabyId: string;
  bfspList: IBFSP[];
  bpspForm: IBFSP;
  bfSupportivePracticePerformedList: ITypeDetails[];
  personWhoPerformedBSFPList: ITypeDetails[];
  dataForBfspPage: IDataForBfspPage;
  onlyNumberRegex: RegExp = /^[0-9]*$/;
  shownGroup: any;
  existingDate:string;
  existingTime:string;
  deliveryDate: Date;
  dischargeDate: Date;
  defaultSelectedDate: Date;
  isWeb : boolean = false;
  minDate: string;
  maxDate: string;
  dateOfBfsp: string = null
  babyCode: string = null
  bfspPerformedConfig: any = {
    title: 'Breastfeeding supportive practice performed'
  };
  personWhoPerformedBfspConfig: any = {
    title: 'Person who performed the BFSP'
  }
  dateOfBfspFlag: boolean = false

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private messageService: MessageProvider,
    public formBuilder: FormBuilder,
    private datePipe: DatePipe,
    private bfspService: BfSupportivePracticeServiceProvider,
    private datePicker: DatePicker,
    private lactationPlatform: LactationProvider,
    private datePickerProvider: DatePickerProvider,
    public modalCtrl: ModalController) {}

  /**
   * @author Naseem Akhtar (naseem@sdrc.co.in)
   * @since - 0.0.1
   * This method gets invoked during initial load of breastfeeding supportive practice.
   * date will be initialize
   * get all the options for all the dropdowns.
   * form control validation
   * fetch all the records for the selected baby and for the selected date
   */
  ngOnInit() {
    this.isWeb = this.lactationPlatform.getPlatform().isWebPWA
    this.dataForBfspPage = this.navParams.get('dataForBfspPage');
    this.babyCode = this.dataForBfspPage.babyCode
    this.dateOfBfsp = this.dataForBfspPage.selectedDate
    if(this.dateOfBfsp)
      this.dateOfBfspFlag = true

    //splitting delivery date to use it new date for min date of datepicker
    let x = this.dataForBfspPage.deliveryDate.split('-')
    this.deliveryDate = new Date(+x[2],+x[1]-1,+x[0])
    let check90Days = new Date(+x[2],+x[1]-1,+x[0])
    check90Days.setDate(check90Days.getDate() + ConstantProvider.messages.threeMonthsOfLife)
    if(this.dataForBfspPage.dischargeDate != null){
      let y = this.dataForBfspPage.dischargeDate.split('-')
      this.dischargeDate = new Date(+y[2],+y[1]-1,+y[0])
      this.defaultSelectedDate = new Date() > this.dischargeDate ? this.deliveryDate : new Date()
    }else{
      if(new Date() > check90Days) {
        this.dischargeDate = check90Days
        this.defaultSelectedDate = this.deliveryDate
      }
      else{
        this.dischargeDate = new Date()
        this.defaultSelectedDate = new Date()
      }
    }


    this.findExpressionsByBabyCodeAndDate();

    this.bfspService.getBreastfeedingSupportivePractice()
      .subscribe(data => {
        this.bfSupportivePracticePerformedList = data;
      }, err => {
        this.messageService.showErrorToast(err)
      });

    this.bfspService.getPersonWhoPerformedBSFP()
      .subscribe(data => {
        this.personWhoPerformedBSFPList = data;
      }, err => {
        this.messageService.showErrorToast(err)
      });
    if(this.isWeb){
      this.minDate=this.datePipe.transform(this.deliveryDate.valueOf(),"yyyy-MM-dd")
      this.maxDate=this.datePipe.transform(this.dischargeDate.valueOf(),"yyyy-MM-dd")
    }
  }

  /**
   * @author - Naseem Akhtar
   * @since - 0.0.1
   * This method documen.getElement is called to scroll to the latest accordion
   * For creating or resetting breastfeedign supportive practice form
   */
  newBFSPForm() {
    this.bfspList = this.bfspService.appendNewRecordAndReturn(this.bfspList, this.dataForBfspPage.babyCode,
      this.dataForBfspPage.selectedDate);
    // document.getElementById('scrollHere').scrollIntoView({behavior: 'smooth'})
  }

  save(bfsp: IBFSP, index) {
    let newData = bfsp.createdDate === null ? true : false
    if(this.dateOfBfsp === null) {
      this.messageService.showErrorToast(ConstantProvider.messages.enterDateOfBfsp);
    }else if(bfsp.timeOfBFSP === null) {
      this.messageService.showErrorToast(ConstantProvider.messages.enterTimeOfBfsp);
    }else if(bfsp.bfspDuration === undefined || !this.checkForOnlyNumber(bfsp.bfspDuration)) {
      this.messageService.showErrorToast(ConstantProvider.messages.durationOfBfsp);
    }else{
      bfsp.dateOfBFSP = this.dateOfBfsp.concat()
      this.bfspService.saveNewBreastFeedingSupportivePracticeForm(bfsp, newData)
      .then(data => {
        this.findExpressionsByBabyCodeAndDate();
        if(newData)
          this.messageService.showSuccessToast(ConstantProvider.messages.saveSuccessfull);
        else
          this.messageService.showSuccessToast(ConstantProvider.messages.updateSuccessfull);
      })
      .catch(err => {
        bfsp.createdDate = null
        this.messageService.showOkAlert('Warning', err);
      })
    }
  }


    /**
   * This method will help in getting existing feed expression for given baby code and date
   * @author Ratikanta
   * @since 0.0.1
   */
  findExpressionsByBabyCodeAndDate() {
    //getting existing feed expression for given baby code and date

    this.bfspService.findByBabyCodeAndDate(this.dataForBfspPage.babyCode,
      this.dataForBfspPage.selectedDate, this.dataForBfspPage.isNewBfsp)
      .then(data => {
          this.bfspList = data
      })
      .catch(err => {
        this.messageService.showErrorToast(err)
        this.bfspList = []
      });
  }




  /**
   * This method will delete the given bf expression
   * @author Ratikanta
   * @since 0.0.1
   * @param {IBFExpression} bfExpression The expression which needs to be deleted
   * @memberof ExpressionTimeFormPage
   */
  delete(bfsp: IBFSP){
    this.messageService.showAlert(ConstantProvider.messages.warning,ConstantProvider.messages.deleteForm).
    then((data)=>{
      if(data){
        this.bfspService.delete(bfsp.id)
          .then(()=>{
            //refreshing the list
            this.findExpressionsByBabyCodeAndDate();
            this.messageService.showSuccessToast(ConstantProvider.messages.deleted)
          })
          .catch(err=>{
            this.messageService.showErrorToast(err)
          })
      }
    })
  }

  /**
   * This function will be used to check the validation for bfspPerformed question, accordingly the next
   * field is disabled or enabled.
   * @author - Naseem Akhtar
   * @param bfsp - the object in the front-end for which the user is entering the data
   * @since - 0.0.1
   */
  setPersonWhoPerformed(bfsp: IBFSP) {
    bfsp.personWhoPerformedBFSP = null;
    if(bfsp.bfspPerformed === 54) {
      setTimeout(d => bfsp.personWhoPerformedBFSP = 56, 100)
    }

    if(bfsp.bfspPerformed != 53) {
      setTimeout( () => bfsp.bfspDuration = null, 100)
    }
   
  }

  /**
   * This following two methods i.e datepicker dialog and timepicker dialog will
   * help in opening the native date and time picker respectively.
   * @author - Naseem Akhtar
   * @since - 0.0.1
   */

  datePickerDialog(){
    this.datePicker.show({
    date: this.defaultSelectedDate,
    minDate: this.deliveryDate.valueOf(),
    maxDate: this.dischargeDate.valueOf(),
    mode: 'date',
    androidTheme: this.datePicker.ANDROID_THEMES.THEME_HOLO_LIGHT
    }).then(
      date => {
        this.dateOfBfsp = this.datePipe.transform(date,"dd-MM-yyyy")
        this.dateOfBfspFlag = true
      },
      err => console.log('Error occurred while getting date: ', err)
    );
  }

  timePickerDialog(bfsp: IBFSP){
    this.datePicker.show({
    date: this.defaultSelectedDate,
    mode: 'time',
    is24Hour: true,
    androidTheme: this.datePicker.ANDROID_THEMES.THEME_HOLO_LIGHT
    }).then(time => {
      this.validateTime(this.datePipe.transform(time, 'HH:mm'), bfsp)
      },
      err => console.log('Error occurred while getting time: ', err)
    );
  }

  /**
   * @author - Naseem Akhtar (naseem@sdrc.co.in)
   * This method will check whether the passed parameter is number or not.
   */
  checkForOnlyNumber(forValidation) {
    if(forValidation === null)
      return true;
    else{
      if(this.onlyNumberRegex.test(forValidation))
        return true;
      else
        return false;
    }
  }

  /**
   * This method will validate time selected by the user, if it is current date,
   * then future time will not be allowed.
   * @author - Naseem Akhtar
   * @since - 0.0.1
  */
  validateTime(time: string, bfsp: IBFSP) {
    let timeSplit = time != null ? time.split(':') : null
    if(timeSplit != null){
      if(parseInt(timeSplit[0]) > 23 || parseInt(timeSplit[1]) > 59) {
        this.messageService.showErrorToast(ConstantProvider.messages.invalidTimeFormat)
        bfsp.timeOfBFSP = null
      }
      else if(bfsp.dateOfBFSP === this.datePipe.transform(new Date(),'dd-MM-yyyy')
        && time > this.datePipe.transform(new Date(),'HH:mm')) {
          this.messageService.showErrorToast(ConstantProvider.messages.futureTime)
          bfsp.timeOfBFSP = null;
      }else if (bfsp.dateOfBFSP === this.dataForBfspPage.deliveryDate &&
        time < this.dataForBfspPage.deliveryTime) {
          this.messageService.showErrorToast(ConstantProvider.messages.pastTime)
          bfsp.timeOfBFSP = null;
      }else if(this.bfspList.filter( d => d.timeOfBFSP === time).length > 1) {
        this.messageService.showErrorToast(ConstantProvider.messages.duplicateTime)
        bfsp.timeOfBFSP = null
      }else{
        bfsp.timeOfBFSP = time
        bfsp.id = bfsp.id != null ? bfsp.id : this.bfspService.getNewBfspId(bfsp.babyCode)
      }
    }
  }

  /**
   * @since - 2.0.1
   * @author - Naseem Akhtar
   * This method will ask the user for confirmation regarding the date that has been
   * selected.
   */
  dateConfirmation() {
    if(this.dateOfBfsp != null) {
      this.messageService.showAlert('Alert', 'Are you sure you want to continue with this date')
      .then( data => {
        if(data){
          this.dataForBfspPage.selectedDate = this.dateOfBfsp.concat()
          this.findExpressionsByBabyCodeAndDate()
        }else {
          this.dateOfBfsp = null
          this.dateOfBfspFlag = false
        }
      }).catch( error => {
        this.messageService.showErrorToast(error)
      })
    }
  }

  saveAllExpressions() {
    if(this.dateOfBfsp != null) {
      let date = this.dateOfBfsp.concat()
      let finalBfspList: IBFSP[] = []

      this.bfspList.forEach( bfsp => {
        if(!bfsp.dateOfBFSP)
          bfsp.dateOfBFSP = date
        
        if(bfsp.timeOfBFSP != null && this.checkForOnlyNumber(bfsp.bfspDuration))
          finalBfspList.push(bfsp)
      })

      if(finalBfspList.length > 0) {
        this.bfspService.saveMultipleBfsp(finalBfspList, this.babyCode, date)
        .then(data => {
          this.findExpressionsByBabyCodeAndDate()
          this.messageService.showSuccessToast(ConstantProvider.messages.saveAllString)
        }).catch( error => this.messageService.showErrorToast('Warning' + error.message))
      }else
        this.messageService.showErrorToast('No valid record to save')
    }else {
      this.messageService.showErrorToast("Please enter the date of bfsp and try saving again.")
    }
  }

  showCalendar() {
    if(this.dateOfBfsp === null || this.dateOfBfsp === '') {
      let datePickerOption: DatePickerOption = {
        minimumDate: this.deliveryDate,
        maximumDate: this.dischargeDate // the maximum date selectable
      };
      const dateSelected =
        this.datePickerProvider.showCalendar(this.modalCtrl,datePickerOption);

      dateSelected.subscribe(date => {
        this.dateOfBfsp = this.datePipe.transform(date,"dd-MM-yyyy")
        this.dateOfBfspFlag = true
        this.dateConfirmation()
      });
    }
  }

  _numberKeyPress(event: any) {
    const pattern = /[0-9\ ]/
    var a = event.charCode
        if(a == 0) {return}
    let inputChar = String.fromCharCode(event.charCode);
    if (event.target["value"].length >= 8 || event.keyCode == 32) {
      event.preventDefault()
    }
    if (!pattern.test(inputChar)) {
      event.preventDefault()
    }
  }

  _formatTime(event: any, bfsp: IBFSP) {
    if (event.target["value"].length == 2) {
      bfsp.timeOfBFSP = event.target["value"]+":"
    }
  }

}

