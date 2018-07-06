import {
  Component
} from '@angular/core';
import {
  IonicPage,
  NavController,
  NavParams,
  MenuController,
  AlertController
} from 'ionic-angular';
import {
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import {
  MessageProvider
} from '../../providers/message/message';
import {
  NewAccountServiceProvider
} from '../../providers/new-account-service/new-account-service';
import {
  ConstantProvider
} from '../../providers/constant/constant';
import { UtilServiceProvider } from '../../providers/util-service/util-service';

/**
 * This is registration page component
 * @author Ratikanta
 * @author Jagat
 * @author Subhadarshani
 * @since 0.0.1
 *
 * @export
 * @class CreateNewAccountPage
 */
@IonicPage()
@Component({
  selector: 'page-create-new-account',
  templateUrl: 'create-new-account.html',
})
export class CreateNewAccountPage {

  public userForm: FormGroup;
  user: IUser = {
    firstName: null,
    lastName: null,
    email: null,
    institution: null,
    country: null,
    state: null,
    district: null,
    isSynced: false,
    syncFailureMessage: null,
    createdDate: null,
    updatedDate: null,
    uuidNumber: null
  }
  namePattern: RegExp = /^[a-zA-Z][a-zA-Z\s\.]+$/;
  emailPattern: RegExp = /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/;
  // emailPattern = "^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$";
  areas: IArea[];
  countries: IArea[];
  states: IArea[];
  districts: IArea[];
  institutes: IArea[];
  countryStatus: boolean = false;
  stateStatus: boolean = false;
  districtStatus: boolean = false;
  institutionStatus: boolean = false;

  selectCountryOptions: any;
  selectStateOptions: any;
  selectDistrictOptions: any;
  selectInstituteOptions: any;

  constructor(public navCtrl: NavController, public navParams: NavParams,public menuCtrl: MenuController,
    private messageService: MessageProvider, public createNewAccountService: NewAccountServiceProvider,
    private alertCtrl: AlertController, public utilService: UtilServiceProvider) {}


  /**
   * Fired when entering a page, after it becomes the active page
   * disable the swipe for the side menu
   *
   * @author Jagat Bandhu
   * @since 1.0.0
   */
  ionViewDidEnter() {
    this.menuCtrl.swipeEnable(false);
  }

  /**
   * Fired when you leave a page, before it stops being the active one
   * enable the swipe for the side menu
   *
   * @author Jagat Bandhu
   * @since 1.0.0
   */
  ionViewWillLeave() {
    this.menuCtrl.swipeEnable(true);
  }

  /**
   * This method call up the initial load of craete new account page.
   * Get all areas
   *
   * @author Jagat Bandhu
   * @since 1.0.0
   */
  ngOnInit() {
    //Getting all areas
    /**
       * @author Subhadarshani
       * The below line of code is commented,as all the country,state district,institution will be no longer dropdown they will be entered manually.
       * 
       */
    // this.createNewAccountService.getAllAreas()
    //   .subscribe(data => {
    //     this.areas = data
    //     this.countries = this.areas.filter(d => d.areaLevel === ConstantProvider.areaLevels.country)
    //   }, err => {
    //     this.messageService.showErrorToast(err)
    //   });

    //   //change the title name of the country select popup
    //   this.selectCountryOptions = {
    //     title: ConstantProvider.messages.selectCountry
    //   }

    //   //change the title name of the state select popup
    //   this.selectStateOptions = {
    //     title: ConstantProvider.messages.selectState
    //   }

    //   //change the title name of the district select popup
    //   this.selectDistrictOptions = {
    //     title: ConstantProvider.messages.selectDistrict
    //   }

    //   //change the title name of the institute select popup
    //   this.selectInstituteOptions = {
    //     title: ConstantProvider.messages.selectInstitute
    //   }


        
      //get the first user from the db
      //get the values of country, state, district, institute, set the values to the respective fields and disable the fields
      
      this.createNewAccountService.getFirstUser()
      .then(data=>{
        if(data != null){         
          this.userForm.controls.country.setValue((data as IUser).country);
          this.userForm.controls.state.setValue((data as IUser).state);
          this.userForm.controls.district.setValue((data as IUser).district);
          this.userForm.controls.institution.setValue((data as IUser).institution);
          this.countryStatus = true;
          this.stateStatus = true;
          this.districtStatus = true;
          this.institutionStatus = true;
        }
      })

    //checks the required fields through form validator
    this.userForm = new FormGroup({
      first_name: new FormControl('', [Validators.required, Validators.pattern(this.namePattern)]),
      last_name: new FormControl('', [Validators.required, Validators.pattern(this.namePattern)]),
      email: new FormControl('', [Validators.required, Validators.pattern(this.emailPattern)]),
      country: new FormControl('', [Validators.required]),
      state: new FormControl('', [Validators.required]),
      district: new FormControl('', [Validators.required]),
      institution: new FormControl('', [Validators.required]),
    });
  }



  /**
   * This method will save the deo data to the database
   *
   * @author Jagat Bandhu
   * @since 0.0.1
   */
  submit() {
    if (!this.userForm.valid) {
      Object.keys(this.userForm.controls).forEach(field => {
        const control = this.userForm.get(field);
        control.markAsTouched({
          onlySelf: true
        });
      });
    }else{
      this.validateEmailId();
    }
  }

 

  /**
   * This method is used to restrict the special character in the input field
   *
   * @author Jagat Bandhu
   * @since 0.0.1
   * @param event
   */
  omit_special_char(event){
    var k;
    k = event.charCode;  //         k = event.keyCode;  (Both can be used)
    return((k > 64 && k < 91) || (k > 96 && k < 123) || k == 8 || k == 32 || (k >= 48 && k <= 57));
  }

  /**
   * This method is used to find the duplicate email id.
   *
   * @author Jagat Bandhu
   * @since 0.0.1
   */
  validateEmailId(){
    this.createNewAccountService.validateEmailId(this.userForm.controls.email.value)
    .then((data)=>{
      if(!data){
        this.userForm.controls.email.setValue(null);
        this.messageService.showSuccessToast(ConstantProvider.messages.emailIdExists);
      }else{
          //Initialize the add new patient object
        this.user = {
          firstName: this.userForm.controls.first_name.value,
          lastName: this.userForm.controls.last_name.value,
          email: this.userForm.controls.email.value.toLowerCase(),
          country: this.userForm.controls.country.value,
          state: this.userForm.controls.state.value,
          district: this.userForm.controls.district.value,
          institution:  this.userForm.controls.institution.value,
          isSynced: false,
          syncFailureMessage: null,
          createdDate: null,
          updatedDate: null,
          uuidNumber: null
        }
        this.createNewAccountService.saveNewUser(this.user)
          .then(data => {
            this.messageService.showSuccessToast(ConstantProvider.messages.submitSuccessfull);
            this.showConfirmAlert()
          })
          .catch(err => {
            this.messageService.showErrorToast(err)
          })
      }
    })
  }

  /**
   * This method will show a success alert with some pre-define message with checkbox for confirmation
   * that user has noted the email id to get the password.
   *
   * @author Jagat Bandhu
   * @author Subhadarshani
   * @description the info message text is changed for lactation intrnational
   * @since 0.0.1
   */
  showConfirmAlert(){
    let password = this.user.email.substring(0, 2) + ConstantProvider.messages.commonPasswordSubString
    let msg =  ConstantProvider.messages.registeredSuccessful + "<b>" + password + "</b>" + "<br>"+ ConstantProvider.messages.waringToNoteDownPasswordMsg
    let confirm = this.alertCtrl.create({
      enableBackdropDismiss: false,
      title: ConstantProvider.messages.important,
      message: msg,
      // inputs: [
      //   {
      //     type: 'checkbox',
      //     label: ConstantProvider.messages.emailNoted,
      //     checked: false,
      //     value: 'unchecked',
      //     handler: (data)=>{
      //       if(data.checked === true)
      //         data.value = 'checked';
      //     }
      //   },
      // ],
      buttons: [
        {
          text: 'Ok',
          handler: (data) => {
            // if(data.length === 0){
            // this.messageService.showErrorToast(ConstantProvider.messages.selectCheckBox)
            //   return false;
            //   }
            //   else
            //   this.navCtrl.pop();
            this.navCtrl.pop();
          }

        }
      ]
    });
    confirm.present();
  }

}
