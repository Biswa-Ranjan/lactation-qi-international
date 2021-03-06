import { ConfigImpl } from './../../class/ConfigImpl';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events, MenuController } from 'ionic-angular';
import { ConstantProvider } from '../../providers/constant/constant';
import { UserServiceProvider } from '../../providers/user-service/user-service';
import { MessageProvider } from '../../providers/message/message';
import { Storage } from '@ionic/storage';

/**
 * This is used for Login page
 *
 * @author Jagat Bandhu
 * @since 0.0.1
 */
@IonicPage()
@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage {


  loginData: ILoginData;
  appVersionNumber: string;
  type: string = 'password';
  showPass: boolean = false;
  babyAdmittedToNameList = ["Level 3 NICU/High Dependency", "Level 2 SNCU/Low Dependency", "Level 1 NICU", "Step-down unit","KMC unit", "Maternity ward"];
  babyAdmissionList = []
  version: string

  constructor(public navCtrl: NavController,
    public  navParams: NavParams,
    private userService: UserServiceProvider,
    private messageService: MessageProvider,
    private events: Events,        
    private storage: Storage,
    public menuCtrl: MenuController) {
    
  }

  /**
   * This method will initilize the username and password variables.
   *
   * @author Jagat Bandhu
   * @since 1.0.0
   */
  ngOnInit() {
    this.loginData = {
      username: '',
      password: ''
    }
    this.setDataForBabyAdmittedToField()


    //setting version
    let config: ConfigImpl = {
      version: '2.3.0',
      latestAppVersionName: '',
      isLoggedIn: null
    }

    this.appVersionNumber = config.version

    
  }
  
  /**
   * This method will going to set the records for baby admitted to dropdown which is present in 
   * Add Patient Page.If the table BabyAdmittedTo is empty then only it is going to set the initial values to the table 
   *
   * @author Subhadarshani
   * @since 1.0.0
   */
  async setDataForBabyAdmittedToField() {
    let data = await this.storage.get(ConstantProvider.dbKeyNames.babyAdmittedTo)

    if (data == null || data == undefined) {      
          let len = 14
          //save new record to local database  
          for (let i = 0; i < this.babyAdmittedToNameList.length; i++) {
            let obj = {
              id: len,
              name: this.babyAdmittedToNameList[i],
              originalName: this.babyAdmittedToNameList[i],
              typeId: ConstantProvider.BabyAdmittedToTypeIds.babyAdmittedToTypeId
            }
            this.babyAdmissionList.push(obj)
            len = len + 1
          }
          await this.storage.set(ConstantProvider.dbKeyNames.babyAdmittedTo, this.babyAdmissionList)        
    }
  }

  /**
   * This method will check the login credential for validation of user and login to the app.
   *
   * @author Jagat Bandhu
   * @since 1.0.0
   */
  login() {
    if (this.loginData.username == "") {
      this.messageService.showErrorToast("Please enter the email")
    } else if (this.loginData.password == "") {
      this.messageService.showErrorToast("Please enter the password")
    } else {
      //this method will return the valid user details, if the user is already exist.
      this.userService.getUserValidation(this.loginData.username)
        .then(data => {
          if (this.loginData.password.toLowerCase() === (this.loginData.username).substring(0, 2).toLowerCase() + ConstantProvider.passwordFormat) {
            this.events.publish('user', data);
            this.userService.setUser(data)
            this.navCtrl.setRoot('HomePage');
          } else {
            this.messageService.showErrorToast(ConstantProvider.messages.invalidCredentials);
          }
        })
        .catch(err => {
          this.messageService.showErrorToast(err);
        })
    }

  }

  /**
   * This method will show a alert message for forgot password
   *
   * @author Jagat Bandhu
   * @since 1.0.0
   */
  forgotPassword() {
    this.messageService.showOkAlert(ConstantProvider.messages.info, ConstantProvider.messages.forgotPasswordMessage);
  }

  /**
   * This method will navigate the user for Creating a New Account to the CreateNewAccountPage.
   *
   * @author Jagat Bandhu
   * @since 1.0.0
   */
  signUp() {
    this.loginData = {
      username: '',
      password: ''
    }
    this.navCtrl.push('CreateNewAccountPage');
  }

  /**
   * This method will show/hide the password to the user
   *
   * @author Jagat Bandhu
   * @since 1.0.0
   */
  showPassword() {
    this.showPass = !this.showPass;

    if (this.showPass) {
      this.type = 'text';
    } else {
      this.type = 'password';
    }
  }

  _runScript(event: any) {
    if (event.keyCode == 13) {
      this.login();
    }
  }

  /**
   * Fired when entering a page, after it becomes the active page
   * disable the swipe for the side menu
   *
   * @author Naseem Akhtar
   * @since 1.0.0
   */
  ionViewDidEnter() {
    this.menuCtrl.swipeEnable(false)
  }

  /**
   * Fired when you leave a page, before it stops being the active one
   * enable the swipe for the side menu
   *
   * @author Naseem Akhtar
   * @since 1.0.0
   */
  ionViewWillLeave() {
    this.menuCtrl.swipeEnable(true)
  }
}
