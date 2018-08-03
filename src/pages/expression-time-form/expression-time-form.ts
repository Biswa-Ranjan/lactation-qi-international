import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalController } from 'ionic-angular';
import { AddNewExpressionBfServiceProvider } from '../../providers/add-new-expression-bf-service/add-new-expression-bf-service';
import { MessageProvider } from '../../providers/message/message';
import { SaveExpressionBfProvider } from '../../providers/save-expression-bf/save-expression-bf';
import { DatePipe } from '@angular/common';
import { ConstantProvider } from '../../providers/constant/constant';
import { BFExpressionDateListProvider } from '../../providers/bf-expression-date-list-service/bf-expression-date-list-service';
import { DatePicker } from '@ionic-native/date-picker';
import { LactationProvider } from '../../providers/lactation/lactation';
import { DatePickerOption, DatePickerProvider } from 'ionic2-date-picker';

/**
 * This page will be used to enter the data of log expression breastfeed form
 * for a particular baby.
 * @author - Naseem Akhtar
 * @since - 0.0.1
 */

@IonicPage()
@Component({
  selector: 'page-expression-time-form',
  templateUrl: 'expression-time-form.html',
})
export class ExpressionTimeFormPage {
  bFExpressions: IBFExpression[];
  bfExpression: IBFExpression;
  bfExpressionMethods: ITypeDetails[];
  locationOfexpressionMethods: ITypeDetails[];
  shownGroup: any;
  dataForBFEntryPage: IDataForBFEntryPage
  methodOfBfExpObject: any;
  locOfExpressionObject: any;
  existingDate: string;
  existingTime: string;
  deliveryDate: Date;
  dischargeDate: Date;
  defaultSelectedDate: Date;
  onlyNumberRegex: RegExp = /^[0-9]*\.[0-9][0-9]$/;
  isWeb : boolean = false;
  minDate: string;
  maxDate: string;
  babyCode: string = null;
  dateOfExpressions: string = null;
  methodOfExpressionConfig: any = {
    title: 'Method of Expression'
  };
  locationWhereExpressionOccuredConfig: any = {
    title: 'Location where expression occured'
  }
  dateOfExpressionFlag: boolean = false
  hasError: boolean = false

  constructor(public navCtrl: NavController, public navParams: NavParams,
    private addNewExpressionBfService: AddNewExpressionBfServiceProvider,
    private messageService: MessageProvider,private lactationPlatform: LactationProvider,
    private bfExpressionTimeService: SaveExpressionBfProvider,
    private expressionBFdateService: BFExpressionDateListProvider,
    private datePipe: DatePipe, private datePicker: DatePicker,
    private datePickerProvider: DatePickerProvider,
    public modalCtrl: ModalController) {
  }

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
    this.dataForBFEntryPage = this.navParams.get('dataForBFEntryPage');
    //setting baby code and date of expressions as per the new requirement and design.
    this.babyCode = this.dataForBFEntryPage.babyCode

    //using timeout to give time to DOM for renderring purpose
    this.dateOfExpressions = this.dataForBFEntryPage.selectedDate
    if(this.dateOfExpressions)
      this.dateOfExpressionFlag = true

    // document.getElementById('').focus()
    
    // if(this.dateOfExpressions != null && this.isWeb) {
    //   let tempDateOfExpression = this.dataForBFEntryPage.selectedDate.split('-')
    //   this.dateOfExpressions = tempDateOfExpression[2] + '-' + tempDateOfExpression[1] + '-'
    //     + tempDateOfExpression[0]
    // }

    let x = this.dataForBFEntryPage.deliveryDate.split('-');
    this.deliveryDate = new Date(+x[2],+x[1]-1,+x[0]);
    let check90Days = new Date(+x[2],+x[1]-1,+x[0]);
    check90Days.setDate(check90Days.getDate() + ConstantProvider.messages.threeMonthsOfLife)

    if(this.dataForBFEntryPage.dischargeDate != null){
      let y = this.dataForBFEntryPage.dischargeDate.split('-')
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
    //Getting method of expressionbf type details
    this.addNewExpressionBfService.getMethodOfExpressionBF()
      .subscribe(data => {
        this.bfExpressionMethods = data;
      }, err => {
        this.messageService.showErrorToast(err)
      });
    //Getting location of expression type detail
    this.addNewExpressionBfService.getLocationOfExpressionBF()
      .subscribe(data => {
        this.locationOfexpressionMethods = data
      }, err => {
        this.messageService.showErrorToast(err)
      });
    // if(this.isWeb){
    //   this.minDate=this.datePipe.transform(this.deliveryDate.valueOf(),"yyyy-MM-dd")
    //   this.maxDate=this.datePipe.transform(this.dischargeDate.valueOf(),"yyyy-MM-dd")
    // }
  }

  /**
   * This method will save a single feed expression into database
   *
   * @param {IBFExpression} BfExpression
   * @author Subhadarshani
   * @since 0.0.1
   */
  saveExpression(bfExpression: IBFExpression) {
    if(!this.hasError) {
      let newData = bfExpression.createdDate === null ? true : false
      //set validations for all the fields
      if(this.dateOfExpressions === null) {
        this.messageService.showErrorToast(ConstantProvider.messages.enterDateOfExpression);
      }else if(bfExpression.timeOfExpression === null) {
        this.messageService.showErrorToast(ConstantProvider.messages.enterTimeOfExpression);
      }else if(!this.validateEBM(bfExpression)) {
        this.messageService.showErrorToast(ConstantProvider.messages.volumeOfMilkExpressedFromBreast);
      }else {
        // bfExpression.dateOfExpression = this.datePipe.transform(this.dateOfExpressions.concat(), 'dd-MM-yyyy')
        bfExpression.dateOfExpression = this.dateOfExpressions.concat()
        this.bfExpressionTimeService.saveBfExpression(bfExpression, newData)
        .then(data => {
          this.findExpressionsByBabyCodeAndDate();
          if(newData)
            this.messageService.showSuccessToast(ConstantProvider.messages.saveSuccessfull)
          else
            this.messageService.showSuccessToast(ConstantProvider.messages.updateSuccessfull);
        })
        .catch(err => {
          bfExpression.createdDate = null;
          this.messageService.showOkAlert('Warning', err);
        })
      }
    }else {
      if(this.dateOfExpressions === null)
        this.messageService.showErrorToast(ConstantProvider.messages.enterDateOfExpression);
      else
        this.hasError = false
    }
  }

  /**
  * This method is going to create a new expression entry for selected date 
  * and keep it on the top and open
  * @memberof ExpressionTimeFormPage
  */
  newExpression() {
    this.bFExpressions = this.expressionBFdateService.appendNewRecordAndReturn(this.bFExpressions,
      this.dataForBFEntryPage.babyCode, 1, this.dataForBFEntryPage.selectedDate)
  }

  /**
 * This method is going to validate the duration of expression field is a decimal field or not and check up to 2 decimal places.
 *
 * @memberof ExpressionTimeFormPage
 */
  validateEBM(bfExpression: IBFExpression) {
    if(bfExpression.volOfMilkExpressedFromLR == null) {
      return true;
    }else if(bfExpression.volOfMilkExpressedFromLR.toString() === ''){
      return true;
    }else {
      let value = bfExpression.volOfMilkExpressedFromLR.toString()
      let rx = /^\d+(?:\.\d{0,2})?$/
      if (rx.test(value) && (bfExpression.volOfMilkExpressedFromLR >= 0 && bfExpression.volOfMilkExpressedFromLR <= 300)) {
        if(value.charAt(value.length-1) === '.')
          bfExpression.volOfMilkExpressedFromLR = parseInt(value.substring(0, value.length-1))
        return true;
      }else {
        return false;
      }
    }
  }

  /**
   * This method will delete the given bf expression
   * @author Ratikanta
   * @since 0.0.1
   * @param {IBFExpression} bfExpression The expression which needs to be deleted
   * @memberof ExpressionTimeFormPage
   */
  delete(bfExpression: IBFExpression){
    this.messageService.showAlert(ConstantProvider.messages.warning,ConstantProvider.messages.deleteForm).
    then((data)=>{
      if(data){
        this.bfExpressionTimeService.delete(bfExpression.id)
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
   * This method will help in getting existing bf expression for given baby code and date
   * @author Ratikanta
   * @since 0.0.1
   */
  findExpressionsByBabyCodeAndDate() {

    //getting existing BF expression for given baby code and date
    this.expressionBFdateService.findByBabyCodeAndDate(this.dataForBFEntryPage.babyCode,
      this.dateOfExpressions, this.dataForBFEntryPage.isNewExpression)
    .then(data => {
        this.bFExpressions = data
    })
    .catch(err => {
      this.messageService.showErrorToast(err)
      this.bFExpressions = []
    })
  }

  /**
   * This following two methods i.e datepicker dialog and timepicker dialog will
   * help in opening the native date and time picker respectively.
   * @author - Naseem Akhtar
   * @since - 0.0.1
   */

  datePickerDialog() {
    this.datePicker.show({
    date: this.defaultSelectedDate,
    minDate: this.deliveryDate.valueOf(),
    maxDate: this.dischargeDate.valueOf(),
    mode: 'date',
    androidTheme: this.datePicker.ANDROID_THEMES.THEME_HOLO_LIGHT
    }).then(
      date => {
        this.dateOfExpressions = this.datePipe.transform(date,"dd-MM-yyyy")
        this.dateOfExpressionFlag = true
        this.findExpressionsByBabyCodeAndDate()
        // this.validateTime(bfExpForm.timeOfExpression, bfExpForm)
      },
      err => console.log('Error occurred while getting date: ', err)
    );
  }

  timePickerDialog(bfExpForm: IBFExpression) {
    this.datePicker.show({
    date: this.defaultSelectedDate,
    mode: 'time',
    is24Hour: true,
    androidTheme: this.datePicker.ANDROID_THEMES.THEME_HOLO_LIGHT
  }).then(
    time => {
      this.validateTime(this.datePipe.transform(time, 'HH:mm'), bfExpForm)
    },
    err => console.log('Error occurred while getting time: ', err)
    );
  }

  /**
   * This method will be called on change in selection of method of expression.
   * If the method of expression is Breastfeed, then volume of milk expressed will be disabled and 
   * cleared off.
   * @author - Naseem Akhtar
   * @param bfExpform - the form which user is editing
   */
  checkVolumeOfMilkExpressed(bfExpform: IBFExpression) {
      bfExpform.volOfMilkExpressedFromLR = null;
      bfExpform.methodOfExpressionOthers = null;
  }

  /**
   * This method will validate time selected by the user, if it is current date,
   * then future time will not be allowed.
   * @author - Naseem Akhtar
   * @since - 0.0.1
  */
 validateTime(time: string, bfExpForm: IBFExpression) {
    let timeSplit = time != null ? time.split(':') : null
    if(timeSplit != null) {
      this.hasError = true
      if(parseInt(timeSplit[0]) > 23 || parseInt(timeSplit[1]) > 59 || time.length != 5) {
        this.messageService.showErrorToast(ConstantProvider.messages.invalidTimeFormat)
        bfExpForm.timeOfExpression = null
      }else if(this.dateOfExpressions === this.datePipe.transform(new Date(),'dd-MM-yyyy')
        && time > this.datePipe.transform(new Date(),'HH:mm')) {
          this.messageService.showErrorToast(ConstantProvider.messages.futureTime)
          bfExpForm.timeOfExpression = null
      }else if(this.dateOfExpressions === this.dataForBFEntryPage.deliveryDate
        && time < this.dataForBFEntryPage.deliveryTime) {
          this.messageService.showErrorToast(ConstantProvider.messages.pastTime)
          bfExpForm.timeOfExpression = null
      }else if(this.bFExpressions.filter( d => d.timeOfExpression === time).length > 1) {
        this.messageService.showErrorToast(ConstantProvider.messages.duplicateTime)
        bfExpForm.timeOfExpression = null
      }else {
        this.hasError = false
        bfExpForm.timeOfExpression = time
        bfExpForm.id = bfExpForm.id != null ? bfExpForm.id : 
        this.bfExpressionTimeService.getNewBfExpressionId(bfExpForm.babyCode)
      }
    }
  }

  saveAllExpressions() {
    if(this.dateOfExpressions != null) {
      let date = this.dateOfExpressions.concat()
      let finalExpressions: IBFExpression[] = []

      this.bFExpressions.forEach(bfExpression => {
        if(!bfExpression.dateOfExpression) {
          bfExpression.dateOfExpression = date
        }

        if(bfExpression.timeOfExpression != null && this.validateEBM(bfExpression)) {
          finalExpressions.push(bfExpression)
        }
      });

      if(finalExpressions.length > 0) {
        this.bfExpressionTimeService.saveMultipleBfExpressions(finalExpressions, this.babyCode, date)
        .then( data => {
          this.findExpressionsByBabyCodeAndDate()
          this.messageService.showSuccessToast(ConstantProvider.messages.saveAllString)
        }).catch( error => this.messageService.showErrorToast('Warning' + error.message))
      }
      else
        this.messageService.showErrorToast("No valid record to save")
    }else {
      this.messageService.showErrorToast("Please enter the date of expression and try saving again.")
    }
  }

  /**
   * @since - 2.0.1
   * @author - Naseem Akhtar
   * This method will ask the user for confirmation regarding the date that has been
   * selected.
   */
  dateConfirmation() {
    if(this.dateOfExpressions != null) {
      this.messageService.showAlert('Alert', 'Are you sure you want to continue with this date')
      .then( data => {
        if(data) {
          this.dataForBFEntryPage.selectedDate = this.dateOfExpressions.concat()
          this.findExpressionsByBabyCodeAndDate()
        }else {
          this.dateOfExpressions = null
          this.dateOfExpressionFlag = false
        }
      }).catch( error => {
        this.messageService.showErrorToast(error)
      })
    }
  }

  showCalendar() {
    if(this.dateOfExpressions === null || this.dateOfExpressions === '') {
      let datePickerOption: DatePickerOption = {
        minimumDate: this.deliveryDate,
        maximumDate: this.dischargeDate
      }
      const dateSelected =
        this.datePickerProvider.showCalendar(this.modalCtrl,datePickerOption);

      dateSelected.subscribe(date => {
        let tempDate = this.datePipe.transform(date,"dd-MM-yyyy")
        if(this.validateDate(tempDate)) {
          this.dateOfExpressions = tempDate
          this.dateOfExpressionFlag = true
          this.dateConfirmation()
        }else {
          this.messageService.showErrorToast(ConstantProvider.messages.invalidDate)
        }
      })
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

  _formatTime(event: any, bfExpression: IBFExpression) {
    if (event.target["value"].length == 2) {
      bfExpression.timeOfExpression = event.target["value"]+":"
    }
  }

  /**
   * This method is used to restrict the special character in the input field
   *
   * @author Naseem Akhtar
   * @since 0.0.1
   * @param event
   */
  omit_aplha_special_char(event) {
    var k;
    k = event.charCode;  //k = event.keyCode;  (Both can be used)
    if(event.target["value"].length <= 5)
      return(k===0 || k===1 || (k>7 && k<10) || k===46 || (k >= 48 && k <= 57));
    else if(event.target["value"].length === 6)
      return(k===0 || k===8 || k===127)
    else
      event.preventDefault()
  }

  validateDate(selectedDate: string) {
    let x = selectedDate.split('-')
    let date = new Date(+x[2], +x[1]-1, +x[0])

    if(date > this.dischargeDate)
      return false
    else
      return true
  }
}
