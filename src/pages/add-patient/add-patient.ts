import { ConstantProvider } from './../../providers/constant/constant';
import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, MenuController, ModalController } from 'ionic-angular';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { OnInit } from '@angular/core';
import { MessageProvider } from '../../providers/message/message';
import { AddNewPatientServiceProvider } from '../../providers/add-new-patient-service/add-new-patient-service';
import { DatePipe } from '@angular/common';
import { UserServiceProvider } from '../../providers/user-service/user-service';
import { DatePicker } from '@ionic-native/date-picker';
import { LactationProvider } from '../../providers/lactation/lactation';
import { DatePickerProvider } from 'ionic2-date-picker';
import { DatePickerOption } from 'ionic2-date-picker';
import { Storage } from '@ionic/storage';
/**
 * This page is used to add new patient details, view the patient and edit the patient record.
 *
 * @export
 * @class AddPatientPage
 * @implements {OnInit}
 * @author Ratikanta
 * @since 0.0.1
 */
@IonicPage()
@Component({
  selector: 'page-add-patient',
  templateUrl: 'add-patient.html',
})

export class AddPatientPage implements OnInit{

  @ViewChild('ddate') ddate
  @ViewChild('dtime') dtime
  public patientForm: FormGroup;
  headerTitle: any;
  first_exp_time;
  delivery_date;
  delivery_time;
  deliveryMethods: ITypeDetails[];
  motherPrenatalMilk: ITypeDetails[];
  hmLactation: ITypeDetails[];
  inpatientOutpatient: ITypeDetails[];
  babyAdmittedTo: ITypeDetails[];
  nicuAdmission: ITypeDetails[];
  babyId: any;
  resetStatus: boolean = true;
  patient: IPatient;
  countryName: string;
  stateName: string;
  institutionName: string;
  outPatientAdmissionStatus: boolean = false;
  babyAdmittedToStatus: boolean = false;
  paramToExpressionPage: IParamToExpresssionPage;
  forEdit: boolean = false;
  motherNameRegex: RegExp = /^[a-zA-Z][a-zA-Z\s\.]+$/;
  alphaNumeric: RegExp = /^[-_ a-zA-Z0-9]+$/;
  numberRegex: RegExp = /^[0-9]+(\.[0-9]*){0,1}$/;
  timeRegex: RegExp = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
  hasError: boolean = false;
  babyIdFound :boolean =false
  /**
   * This property is going to tell us, whether the user is using PWA or android app
   * @author Jagat
   * @type {boolean}
   * @memberof AddPatientPage
   * @since 2.0.0
   */
  isWeb : boolean = false;
  maxDate: Date;
  minDate: Date;
  private uniquePatientId : IUniquePatientId = {
    id: null,
    idNumber: null
  }



  constructor(public navCtrl: NavController, public navParams: NavParams,
    private addNewPatientService: AddNewPatientServiceProvider,private datePipe: DatePipe,
    private messageService: MessageProvider,private datePicker: DatePicker,
    private userService: UserServiceProvider, private menuCtrl: MenuController,
    private lactationPlatform: LactationProvider,private datePickerProvider: DatePickerProvider,
    public modalCtrl: ModalController,private storage : Storage) {
  }

  /**
   * This method will used for handle the custom back button
   *
   * @author Jagat Bandhu
   * @since 0.0.1
   */
  customBackBUtton(){
    this.navCtrl.pop();
  }

  /**
   * This method will used for cancel the current page and redirect to previous page
   *
   * @author Jagat Bandhu
   * @since 0.0.1
   */
  reset(){
    /**
     * This iteration will be used to untouch all the fields, because the user wants a new form.
     * @author - Naseem Akhtar
     */

    Object.keys(this.patientForm.controls).forEach(field => {
      this.resetStatus = false;
      const control = this.patientForm.get(field);
      control.markAsUntouched({onlySelf: true});
      control.markAsPristine({onlySelf: true});
    });
    this.patientForm.controls.baby_id.setValue(null)
    this.patientForm.controls.hospital_baby_id.setValue(null)
    this.patientForm.controls.mother_name.setValue(null)
    this.patientForm.controls.mother_age.setValue(null)

    if(!this.forEdit){
      this.patientForm.controls.delivery_date.setValue(null)
      this.patientForm.controls.delivery_time.setValue(null)
    }

    this.patientForm.controls.delivery_method.setValue(null)
    this.patientForm.controls.baby_weight.setValue(null)
    this.patientForm.controls.gestational_age.setValue(null)
    this.patientForm.controls.intent_provide_milk.setValue(null)
    this.patientForm.controls.hm_lactation.setValue(null)
    // this.patientForm.controls.first_exp_time_in_hour.setValue(null)
    // this.patientForm.controls.first_exp_time_in_minute.setValue(null)
    this.patientForm.controls.inpatient_outpatient.setValue("")
    this.patientForm.controls.admission_date.setValue(null)
    this.patientForm.controls.baby_admitted.setValue(null)
    this.babyAdmittedToStatus = false
    this.patientForm.controls.nicu_admission.setValue(null)
    this.patientForm.controls.discharge_date.setValue(null)
  }

  /**
   * Fired when entering a page, after it becomes the active pages
   *
   * @author Jagat Bandhu
   * @since 1.0.0
   */
  ionViewDidEnter(){
    this.menuCtrl.swipeEnable(false);
    if(!(this.navParams.get('babyCode') == undefined)){
      this.forEdit = true;
      this.uniquePatientId.id = this.patient.babyCode;
      this.setFetchedDataToUi();
    }
    //Below line of codes are for generating uniquebabyID, Which is no longer required
    // else{
    //   this.getUniquePatientId();
    // }
  }

  /**
   * It’s fired when entering a page, before it becomes the active one
   * enable the swipe for the side menu
   *
   * @author Jagat Bandhu
   * @since 1.0.0
   */
  ionViewWillLeave() {
    this.menuCtrl.swipeEnable(true);
  }

 /**
  * This method call up the initial load of add patient page.
   * date will be initialize
   * get all the options for all the dropdowns.
   * form control validation
   *
   * @author Jagat Bandhu
   * @since 1.0.0
  */
  ngOnInit() {
    this.isWeb = this.lactationPlatform.getPlatform().isWebPWA
    // this.maxDate=this.datePipe.transform(new Date().valueOf(),"yyyy-MM-dd")
    // this.minDate = this.datePipe.transform(new Date(new Date().getFullYear(),(new Date().getMonth()),(new Date().getDate())-89).valueOf(),"yyyy-MM-dd")
    this.maxDate = new Date()
    this.minDate = new Date(new Date().getFullYear(),(new Date().getMonth()),(new Date().getDate())-89)

    if(!(this.navParams.get('babyCode') == undefined)){

      this.headerTitle = "Edit Patient"
      this.paramToExpressionPage = {
        babyCode: this.navParams.get('babyCode'),
        deliveryDate: this.navParams.get('deliveryDate'),
        deliveryTime: null,
        dischargeDate: this.navParams.get('dischargeDate')
      }

      this.addNewPatientService.findByBabyCode(this.paramToExpressionPage.babyCode)
      .then(data=>{
        this.patient = data
      })
      .catch(err=>{
        this.messageService.showErrorToast(err)
      })

    } else {
      this.headerTitle = "Add Patient";
    }

    this.delivery_date = new Date().toISOString();
    this.delivery_time = new Date().toISOString();

    //Getting delivery methods type details
    this.addNewPatientService.getDeliveryMethod()
    .subscribe(data =>{
      this.deliveryMethods = data
    }, err => {
      this.messageService.showErrorToast(err)
    });

    //Getting mother's prenatal milk type details
    this.addNewPatientService.getMotherParenatalMilk()
    .subscribe(data =>{
      this.motherPrenatalMilk = data
    }, err => {
      this.messageService.showErrorToast(err)
    });
    //Getting hmLactation type details
    this.addNewPatientService.getHmAndLactation()
    .subscribe(data =>{
      this.hmLactation = data
    }, err => {
      this.messageService.showErrorToast(err)
    });

    //Getting inpatient and outpatient type details
    this.addNewPatientService.getInpatientOutpatient()
    .subscribe(data =>{
      this.inpatientOutpatient = data
    }, err => {
      this.messageService.showErrorToast(err)
    });

    //Getting baby admitted to type details
    // this.addNewPatientService.getBabyAdmittedTo()
    // .subscribe(data =>{
    //   this.babyAdmittedTo = data
    // }, err => {
    //   this.messageService.showErrorToast(err)
    // });
    

    this.storage.get(ConstantProvider.dbKeyNames.babyAdmittedTo).then(data=>{
      if(data!=null){
        this.babyAdmittedTo = data
      }
      
    })

    //Getting nicu admission reason type details
    this.addNewPatientService.getNICAdmissionReason()
    .subscribe(data =>{
      this.nicuAdmission = data
    }, err => {
      this.messageService.showErrorToast(err)
    });

    this.patientForm = new FormGroup({
      baby_id: new FormControl(null,[Validators.required,Validators.pattern(this.alphaNumeric)]),
      hospital_baby_id: new FormControl(null, [Validators.pattern(this.alphaNumeric), Validators.maxLength(25)]),
      mother_name: new FormControl(null, [Validators.pattern(this.motherNameRegex), Validators.maxLength(30)]),
      mother_age: new FormControl(null),
      delivery_date: new FormControl(null),
      delivery_time: new FormControl(null,[Validators.required,Validators.pattern(this.timeRegex)]),
      delivery_method: new FormControl(null),
      baby_weight: new FormControl(null),
      gestational_age: new FormControl(null),
      intent_provide_milk: new FormControl(null),
      hm_lactation: new FormControl(null),
      // first_exp_time_in_hour: new FormControl(null,[Validators.pattern(this.numberRegex)]),
      // first_exp_time_in_minute: new FormControl(null,[Validators.max(59)]),
      inpatient_outpatient: new FormControl(null),
      admission_date: new FormControl(null),
      baby_admitted: new FormControl(null),
      nicu_admission: new FormControl(null),
      discharge_date: new FormControl(null),
      });


    }

    // onlyNumberKey(event) {
    //   return (event.charCode == 8 || event.charCode == 0) ? null : event.charCode >= 48 && event.charCode <= 57;
    // }

    /**
     * This method will make visible the Admission Date field based on the input of inpatient outpatient.
     *
     * @author Jagat Bandhu
     * @since 1.0.0
     */
     outpatientAdmission(){
       if(this.patientForm.controls.inpatient_outpatient.value != undefined && this.patientForm.controls.inpatient_outpatient.value != null){
        if(this.patientForm.controls.inpatient_outpatient.value==ConstantProvider.typeDetailsIds.outPatient){
          this.outPatientAdmissionStatus = true;
         } else {
          this.outPatientAdmissionStatus = false;
          this.patientForm.controls.admission_date.setValue(null);
          this.patientForm.controls["admission_date"].setErrors(null);
         }
       }
     }

    /**
     * This method will validate the mother age.
     *
     * @author Jagat Bandhu
     * @since 1.0.0
     */
     validateMotherAge(){
       if(!this.hasError){
        if (this.patientForm.controls.mother_age.value != "" && this.patientForm.controls.mother_age.value != null){
          if (this.patientForm.controls.mother_age.value < 14 ||
            this.patientForm.controls.mother_age.value > 60) {
            this.hasError = true;
           this.messageService.showAlert(ConstantProvider.messages.warning,ConstantProvider.messages.motherAge)
           .then((data)=>{
             if(!data){
               this.patientForm.controls.mother_age.setValue(null);
             }
             this.hasError = false;
           })
          }
        }
       }
     }

    /**
     * This method will validate the baby weight.
     *
     * @author Jagat Bandhu
     * @since 1.0.0
     */
     validateBabyWeight() {
      if(!this.hasError){
        if(this.patientForm.controls.baby_weight.value != "" && this.patientForm.controls.baby_weight.value != null){
          if (this.patientForm.controls.baby_weight.value < 400 ||
            this.patientForm.controls.baby_weight.value > 6000) {
              this.hasError = true;
           this.messageService.showAlert(ConstantProvider.messages.warning,ConstantProvider.messages.babyOverWeight)
           .then((data)=>{
             if(!data){
               this.patientForm.controls.baby_weight.setValue(null);
             }
             this.hasError = false;
           })
          }
         }
        }
      }

    /**
     * This method will validate the GEstational week.
     *
     * @author Jagat Bandhu
     * @since 1.0.0
     */
     validateGestational() {
      if(!this.hasError){
        if (this.patientForm.controls.gestational_age.value != "" && this.patientForm.controls.gestational_age.value != null){
          if (this.patientForm.controls.gestational_age.value < 38 ||
            this.patientForm.controls.gestational_age.value > 42) {
              this.hasError = true;
           this.messageService.showAlert(ConstantProvider.messages.warning,ConstantProvider.messages.babyGestational)
           .then((data)=>{
             if(!data){
               this.patientForm.controls.gestational_age.setValue(null);
             }
             this.hasError = false;
           })
          }
        }
      }
    }

    /**
    * This method will save the patient data to the database
    * @author Jagat Bandhu
    * @since 0.0.1
    */
    async submit(){
                                         
      if(!this.patientForm.controls.baby_id.value) {
        document.getElementById('babyId').scrollIntoView({behavior: 'smooth'})
      }else if(this.patientForm.controls.delivery_date.value == null){
        document.getElementById('ddate').scrollIntoView({behavior: 'smooth'})
      } else if(this.patientForm.controls.delivery_time.value == null || (this.isWeb && !this.validateWebDeliveryTime())) {
        document.getElementById('dtime').scrollIntoView({behavior: 'smooth'})
      }

      // if(this.isWeb){
      //   this.patientForm.controls.delivery_date.setValue(this.datePipe.transform(this.patientForm.controls.delivery_date.value,"dd-MM-yyyy"))
      // }

      this.outpatientAdmission();
      this.babyAdmitedToCheck();

        if(this.validateDischargeDate()){
          if(!this.patientForm.valid){
            this.resetStatus = true;
            Object.keys(this.patientForm.controls).forEach(field => {
              const control = this.patientForm.get(field);
              control.markAsTouched({ onlySelf: true });
              // this.patientForm.controls.delivery_date.
            });
            this.messageService.showErrorToast(ConstantProvider.messages.allFieldMandatory)
          } else {
            this.resetStatus = false;
  
            //Initialize the add new patient object
            this.patient = {
              babyCode: this.patientForm.controls.baby_id.value.toUpperCase(),
              babyOf: this.patientForm.controls.mother_name.value,
              mothersAge: this.patientForm.controls.mother_age.value==null?null:parseInt(this.patientForm.controls.mother_age.value),
              deliveryDate: this.patientForm.controls.delivery_date.value,
              deliveryTime: this.patientForm.controls.delivery_time.value,
              deliveryMethod: this.patientForm.controls.delivery_method.value,
              babyWeight: this.patientForm.controls.baby_weight.value==null?null:parseFloat(this.patientForm.controls.baby_weight.value),
              gestationalAgeInWeek: this.patientForm.controls.gestational_age.value==null?null:parseInt(this.patientForm.controls.gestational_age.value),
              mothersPrenatalIntent: this.patientForm.controls.intent_provide_milk.value,
              parentsKnowledgeOnHmAndLactation: this.patientForm.controls.hm_lactation.value,
              // timeTillFirstExpressionInHour: this.patientForm.controls.first_exp_time_in_hour.value,
              // timeTillFirstExpressionInMinute: this.patientForm.controls.first_exp_time_in_minute.value,
              inpatientOrOutPatient: this.patientForm.controls.inpatient_outpatient.value,
              admissionDateForOutdoorPatients: this.patientForm.controls.admission_date.value,
              babyAdmittedTo: this.patientForm.controls.baby_admitted.value,
              nicuAdmissionReason: this.patientForm.controls.nicu_admission.value,
              dischargeDate: this.patientForm.controls.discharge_date.value,
              isSynced: false,
              syncFailureMessage: null,
              userId: this.userService.getUser().email,
              createdDate: null,
              updatedDate: null,
              uuidNumber: null
            }

            //save and update the patient to the db
            this.addNewPatientService.saveNewPatient(this.patient, this.uniquePatientId.idNumber)
              .then(data=> {
                if(this.forEdit){
                  this.messageService.showSuccessToast(ConstantProvider.messages.updateSuccessfull);
                }else{
                  this.messageService.showSuccessToast(ConstantProvider.messages.submitSuccessfull);
                }
              this.navCtrl.pop();
            })
              .catch(err =>{
              this.messageService.showErrorToast(err)
            })
          }
        }
      // }
      
      
    }
    /**
     * This method will going to check baby id exists or not
     *
     * @author Jagat Bandhu Sahoo
     * @since 0.0.1
     */
     isBabyIdExists() : boolean {
       this.storage.get(ConstantProvider.dbKeyNames.patients).then(data=>{
         for(let i=0;i<data.length;i++){
          if(data[i].babyCode === this.patientForm.controls.baby_id.value ){       
            this.babyIdFound = true;
            break                                                       
          }
         }
       })
     return  this.babyIdFound
  }
    /**
     * This method will set the value taken from the db to ui component.
     *
     * @author Jagat Bandhu Sahoo
     * @since 0.0.1
     */
    setFetchedDataToUi(){

      this.patientForm = new FormGroup({
        baby_id: new FormControl(this.patient.babyCode,[Validators.required,Validators.pattern(this.alphaNumeric)]),
        mother_name: new FormControl(this.patient.babyOf, [Validators.pattern(this.motherNameRegex), Validators.maxLength(30)]),
        mother_age: new FormControl(this.patient.mothersAge),
        delivery_date: new FormControl(this.patient.deliveryDate,[Validators.required]),
        delivery_time: new FormControl(this.patient.deliveryTime,[Validators.required,Validators.pattern(this.timeRegex)]),
        delivery_method: new FormControl(this.patient.deliveryMethod),
        baby_weight: new FormControl(this.patient.babyWeight),
        gestational_age: new FormControl(this.patient.gestationalAgeInWeek),
        intent_provide_milk: new FormControl(this.patient.mothersPrenatalIntent),
        hm_lactation: new FormControl(this.patient.parentsKnowledgeOnHmAndLactation),
        // first_exp_time_in_hour: new FormControl(this.patient.timeTillFirstExpressionInHour,[Validators.pattern(this.numberRegex)]),
        // first_exp_time_in_minute: new FormControl(this.patient.timeTillFirstExpressionInMinute,[Validators.max(59)]),
        inpatient_outpatient: new FormControl(this.patient.inpatientOrOutPatient),
        admission_date: new FormControl(this.patient.admissionDateForOutdoorPatients == null?null: this.patient.admissionDateForOutdoorPatients),
        baby_admitted: new FormControl(this.patient.babyAdmittedTo),
        nicu_admission: new FormControl(this.patient.nicuAdmissionReason),
        discharge_date: new FormControl(this.patient.dischargeDate),
      });
      this.outpatientAdmission();
      this.babyAdmitedToCheck();
    }

    /**
     * This method will show a native date picker to select date
     *
     * @author Jagat Bandhu
     * @since 1.0.0
     */
    datePickerDialog(type: string){
      if(!this.hasError){
        this.datePicker.show({
          mode: 'date',
          date: new Date(),
          maxDate: new Date().valueOf(),
          androidTheme: this.datePicker.ANDROID_THEMES.THEME_HOLO_LIGHT
        }).then(
          date => {
            switch(type){
              case ConstantProvider.datePickerType.addmissionDate:
                this.patientForm.controls.admission_date.setValue(this.datePipe.transform(date,"dd-MM-yyyy"))
              break;
              case ConstantProvider.datePickerType.dischargeDate:
                this.patientForm.controls.discharge_date.setValue(this.datePipe.transform(date,"dd-MM-yyyy"))
              break;
            }
          },
          err => console.log('Error occurred while getting date: ', err)
        );
      }
    }

    /**
     * This method will show a native date picker to select a date
     *
     * @author Jagat Bandhu
     * @since 1.0.0
     */
    deliveryDatePicker(type: string){
      if(!this.hasError){
        if(!this.forEdit){
          this.datePicker.show({
            mode: 'date',
            date: new Date(),
            minDate: new Date(new Date().getFullYear(),(new Date().getMonth()),(new Date().getDate())-89).valueOf(),
            maxDate: new Date().valueOf(),
            androidTheme: this.datePicker.ANDROID_THEMES.THEME_HOLO_LIGHT
          }).then(
            date => {
              switch(type){
                case ConstantProvider.datePickerType.deliveryDate:
                  this.patientForm.controls.delivery_date.setValue(this.datePipe.transform(date,"dd-MM-yyyy"));
                  if(this.patientForm.controls.delivery_time.value != ""){
                    this.patientForm.controls.delivery_time.setValue(null);
                  }
              }
            },
            err => console.log('Error occurred while getting date: ', err)
          );
        }
      }
    }

    /**
     * This method will show a native time picker to select a time
     *
     * @author Jagat Bandhu
     * @since 1.0.0
     */
    timePickerDialog(){
      if(!this.hasError){
        if(!this.forEdit){
          this.datePicker.show({
            date: new Date(),
            mode: 'time',
            is24Hour: true,
            androidTheme: this.datePicker.ANDROID_THEMES.THEME_HOLO_LIGHT
          })
          .then(
            time => {
              this.validateTime(time)
            },
            err => console.log('Error occurred while getting time: ', err)
            );
        }
      }
    }

    /**
     * This method is used to validate the discharge field that it should not the greater than the delivery date
     *
     * @author Jagat Bandhu
     * @since 0.0.1
     * @param event
     */
    validateDischargeDate(): boolean{
      if(this.patientForm.controls.discharge_date.value != "" && this.patientForm.controls.discharge_date.value != null){
        if(this.patientForm.controls.delivery_date.value != "" && this.patientForm.controls.delivery_date.value != null){

          let dateA = this.patientForm.controls.discharge_date.value;
          let dayA = parseInt(dateA.split('-')[0])
          let monthA = parseInt(dateA.split('-')[1])
          let yearA = parseInt(dateA.split('-')[2])

          let dateB = this.patientForm.controls.delivery_date.value;
          let dayB = parseInt(dateB.split('-')[0])
          let monthB = parseInt(dateB.split('-')[1])
          let yearB = parseInt(dateB.split('-')[2])

          let dateOfA: Date = new Date(yearA, monthA, dayA)
          let dateOfB: Date = new Date(yearB, monthB, dayB)

          if(dateOfA < dateOfB){
            this.patientForm.controls.discharge_date.setValue("");
            this.messageService.showErrorToast(ConstantProvider.messages.dischargeDateValidation)
            return false;
          }else{
            return true;
          }
        }else{
          return true;
        }
      }
      return true;
    }

    /**
     * This method will generate baby id
     *
     * @author Jagat Bandhu
     * @author Ratikanta
     * @since 1.0.0
    */
    async getUniquePatientId(){
      try{
        this.uniquePatientId = await this.addNewPatientService.getBabyId()
        this.patientForm.controls.baby_id.setValue(this.uniquePatientId.id);
      }catch(err){
        this.messageService.showErrorToast(err)
      }
    }

    /**
     * This method will make visible the Reason for NICU admission field based on the input field of baby admitted to.
     *
     * @author Jagat Bandhu
     * @since 1.0.0
     */
    babyAdmitedTo(){
      if(this.patientForm.controls.baby_admitted.value != undefined || this.patientForm.controls.baby_admitted.value != null){
        if(this.patientForm.controls.baby_admitted.value==ConstantProvider.typeDetailsIds.level3NICU ||
          this.patientForm.controls.baby_admitted.value==ConstantProvider.typeDetailsIds.level2SNCU ||
          this.patientForm.controls.baby_admitted.value==ConstantProvider.typeDetailsIds.level1NICU){
          this.patientForm.controls.nicu_admission.setValue(null);
          this.babyAdmittedToStatus = true;
         } else {
          this.babyAdmittedToStatus = false;
          this.patientForm.controls.nicu_admission.setValue(null);
          this.patientForm.controls["nicu_admission"].setErrors(null);
         }
       }
    }

    /**
     * This method will validate the question baby addmitted to and show hide the dependanecy question based
     * on the response of the baby addmitted to
     *
     * @author Jagat Bandhu
     * @since 1.0.0
     */
    babyAdmitedToCheck(){
      if(this.patientForm.controls.baby_admitted.value != undefined || this.patientForm.controls.baby_admitted.value != null){
        if(this.patientForm.controls.baby_admitted.value==ConstantProvider.typeDetailsIds.level3NICU ||
          this.patientForm.controls.baby_admitted.value==ConstantProvider.typeDetailsIds.level2SNCU ||
          this.patientForm.controls.baby_admitted.value==ConstantProvider.typeDetailsIds.level1NICU){
          this.babyAdmittedToStatus = true;
         } else {
          this.babyAdmittedToStatus = false;
          this.patientForm.controls.nicu_admission.setValue(null);
          this.patientForm.controls["nicu_admission"].setErrors(null);
         }
       }
    }

  /**
   * This method will validate the delivery time
   *
   * @author Jagat Bandhu
   * @since 1.0.0
   * @param time
   */
	validateTime(time){
    if(this.patientForm.controls.delivery_date.value != "" && this.patientForm.controls.delivery_date.value != null){
      if(this.patientForm.controls.delivery_date.value === this.datePipe.transform(new Date(),"dd-MM-yyyy") ){
        if(this.datePipe.transform(time,"HH:mm") > this.datePipe.transform(new Date(),"HH:mm")){
          this.patientForm.controls.delivery_time.setValue("")
          this.messageService.showErrorToast(ConstantProvider.messages.futureTime)
        }else{
          this.patientForm.controls.delivery_time.setValue(this.datePipe.transform(time,"HH:mm"))
        }
      }else{
        this.patientForm.controls.delivery_time.setValue(this.datePipe.transform(time,"HH:mm"))
      }
    }else{
      this.patientForm.controls.delivery_time.setValue(this.datePipe.transform(time,"HH:mm"))
    }
  }

  validateWebDeliveryTime(): boolean{

    let deliveryTime: string = this.patientForm.controls.delivery_time.value
    let validated: boolean = true
    if(this.patientForm.controls.delivery_date.value != "" &&
    this.patientForm.controls.delivery_date.value != null){
      if(this.patientForm.controls.delivery_date.value === this.datePipe.transform(new Date(),"dd-MM-yyyy") ){
        if( deliveryTime > this.datePipe.transform(new Date(),"HH:mm")){
          this.patientForm.controls.delivery_time.setValue("")
          this.messageService.showErrorToast(ConstantProvider.messages.futureTime)
          validated = false
        }else{
          this.patientForm.controls.delivery_time.setValue(deliveryTime)
        }
      }else{
        this.patientForm.controls.delivery_time.setValue(deliveryTime)
      }
    }else{
      this.patientForm.controls.delivery_time.setValue(deliveryTime)
    }

    return validated
  }

  _numberKeyPress(event: any) {
    const pattern = /[0-9\ ]/;
    var a = event.charCode;
        if(a==0){return;}
    let inputChar = String.fromCharCode(event.charCode);
    if (event.target["value"].length >= 8 || event.keyCode == 32) {
      event.preventDefault();
    }
    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }

  /**
   *This method will show date picker for web browser and do the processing after user 
   selet date
   * @author jagat
   * @param {string} type
   * @memberof AddPatientPage
   */
  showCalendar(type: string) {
    let datePickerOption: DatePickerOption = {
      minimumDate: this.minDate, // minimum date selectable
      maximumDate: this.maxDate // the maximum date selectable
    };

    if(type === ConstantProvider.datePickerType.deliveryDate) {
      if(this.patientForm.controls.admission_date.value) {
        let tempDate = this.patientForm.controls.admission_date.value.split('-')
        datePickerOption.maximumDate = new Date(tempDate[2], tempDate[1] - 1, tempDate[0])
      }else if(this.patientForm.controls.discharge_date.value) {
        let tempDate = this.patientForm.controls.discharge_date.value.split('-')
        datePickerOption.maximumDate = new Date(tempDate[2], tempDate[1] - 1, tempDate[0])
      }
    }else if(type === ConstantProvider.datePickerType.addmissionDate &&
       this.patientForm.controls.delivery_date.value != null) {
        let tempDate = this.patientForm.controls.delivery_date.value.split('-')
        datePickerOption.minimumDate = new Date(tempDate[2], tempDate[1] - 1, tempDate[0])

        if(this.patientForm.controls.discharge_date.value) {
          let splitDischargeDate = this.patientForm.controls.discharge_date.value.split('-')
          let tempDischargeDate = new Date(splitDischargeDate[2], splitDischargeDate[1]-1, splitDischargeDate[0])
          if(tempDischargeDate < this.maxDate)
            datePickerOption.maximumDate = tempDischargeDate
        }
    }else if(type === ConstantProvider.datePickerType.dischargeDate &&
      this.patientForm.controls.delivery_date.value != null) {
        let tempDate = this.patientForm.controls.delivery_date.value.split('-')
        datePickerOption.minimumDate = new Date(tempDate[2], tempDate[1] - 1, tempDate[0])
    }

    const dateSelected = this.datePickerProvider.showCalendar(this.modalCtrl,datePickerOption);

    dateSelected.subscribe(date => {
      switch(type){
        case ConstantProvider.datePickerType.deliveryDate:
          this.patientForm.controls.delivery_date.setValue(this.datePipe.transform(date,"dd-MM-yyyy"))
          let splitDeliveryDate = this.patientForm.controls.delivery_date.value.split('-')
          let tempDeliveryDate = new Date(splitDeliveryDate[2], splitDeliveryDate[1]-1, splitDeliveryDate[0])
          
          if(this.patientForm.controls.admission_date.value) {
            let splitAdmissionDate = this.patientForm.controls.admission_date.value.split('-')
            let tempAdmissionDate = new Date(splitAdmissionDate[2], splitAdmissionDate[1]-1, splitAdmissionDate[0])

            if(tempDeliveryDate > tempAdmissionDate) {
              this.patientForm.controls.delivery_date.setValue(null)
              this.messageService.showErrorToast('Outpatient\'s delivery date cannot be greater than admission date')
            }
          }else if(this.patientForm.controls.discharge_date.value) {
            let splitDischargeDate = this.patientForm.controls.discharge_date.value.split('-')
            let tempDishcargeDate = new Date(splitDischargeDate[2], splitDischargeDate[1]-1, splitDischargeDate[0])

            if(tempDeliveryDate > tempDishcargeDate) {
              this.patientForm.controls.delivery_date.setValue(null)
              this.messageService.showErrorToast('Delivery date cannot be greater than discharge date')
            }
          }
          // this.patientForm.controls.delivery_date.markAsTouched()
        break;
        case ConstantProvider.datePickerType.addmissionDate:
          this.patientForm.controls.admission_date.setValue(this.datePipe.transform(date,"dd-MM-yyyy"))
        break;
        case ConstantProvider.datePickerType.dischargeDate:
          this.validateDischargeDateForWeb(date)          
          break;
      }
    });
  }

  _formatTime(event: any) {
    if (event.target["value"].length == 2){
      this.patientForm.controls.delivery_time.setValue(event.target["value"]+":")
    }
  }

  showCalendarForDeliveryDate(type: string) {
    if(!this.forEdit && !this.hasError)
      this.showCalendar(type)
  }

  async checkBabyId() {
    //check for duplicate baby id
    if(this.patientForm.controls.baby_id.value) {
      let patientData = await this.addNewPatientService.isBabyIdExistaOrNot(this.patientForm.controls.baby_id.value.toUpperCase())   
      if(patientData){
        this.messageService.showErrorToast(ConstantProvider.messages.babyIdExistsMsg);
        this.patientForm.controls.baby_id.setValue(null)
      }
    }
  }

  /**
   * This method is used to restrict the special character in the input field
   *
   * @author Naseem Akhtar
   * @since 0.0.1
   * @param event
   */
  _preventManualEntry(event) {
    event.preventDefault()
  }


  /**
   * This method is going to validate the discharge date
   * @author Ratikanta
   * @param {Date} dischargeDate
   * @memberof AddPatientPage
   */
  async validateDischargeDateForWeb(dischargeDate: Date){
    try{
      if(this.forEdit){
        await this.addNewPatientService.validateDischargeDate(dischargeDate, this.navParams.get('babyCode'))
      }
      this.patientForm.controls.discharge_date.setValue(this.datePipe.transform(dischargeDate,"dd-MM-yyyy"))
      if(this.patientForm.controls.admission_date.value) {
        let splitAdmissionDate = this.patientForm.controls.admission_date.value.split('-')
        let tempAdmissionDate = new Date(splitAdmissionDate[2], splitAdmissionDate[1]-1, splitAdmissionDate[0])
        let splitDischargeDate = this.patientForm.controls.discharge_date.value.split('-')
        let tempDischargeDate = new Date(splitDischargeDate[2], splitDischargeDate[1]-1, splitDischargeDate[0])
        if(tempDischargeDate < tempAdmissionDate) {
          this.patientForm.controls.admission_date.setValue(null)
          this.messageService.showErrorToast('Admission date for outdoor patients cannot be greater than discharge date')
        }
      }
    }catch(err){
      this.messageService.showErrorAlert(err)
    }
    
  }
}
