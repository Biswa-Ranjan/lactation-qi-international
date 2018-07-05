import {
  Component
} from '@angular/core';
import {
  IonicPage,
  NavController,
  NavParams,
  AlertController
} from 'ionic-angular';
import {
  MessageProvider
} from '../../providers/message/message';
import {
  Storage
} from '@ionic/storage';
import {
  ConstantProvider
} from '../../providers/constant/constant';
import {
  AddNewExpressionBfServiceProvider
} from '../../providers/add-new-expression-bf-service/add-new-expression-bf-service';
import {
  AddNewPatientServiceProvider
} from '../../providers/add-new-patient-service/add-new-patient-service';
import {
  SettingsPageModule
} from './settings.module';
import {
  SettingsServiceProvider
} from '../../providers/settings-service/settings-service';

/**
 * Generated class for the SettingsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html',
})
export class SettingsPage {
  isBlank: boolean
  babyAdmissionList: ITypeDetails[];
  lastTypedetailsID: number
  isRecordFound: boolean = true;
  constructor(public navCtrl: NavController, public navParams: NavParams, private messageService: MessageProvider,
    private storage: Storage, private addNewPatientService: AddNewPatientServiceProvider, private settingsService: SettingsServiceProvider,
    private alertController: AlertController) {

  }
  ngOnInit() {
    this.getData()
  }
  /**
   * This method get the baby Admitted to List from local db   *
   * @author Subhadarshani
   * @since 0.0.1
   */
  async getData() {
    let data = await this.storage.get(ConstantProvider.dbKeyNames.babyAdmittedTo)
    console.log(data)
    if (data != null && data.length > 0) {
      this.babyAdmissionList = data
      this.isRecordFound = false;
    } else {
      this.isRecordFound = true;
      this.babyAdmissionList = []
    }
    console.log(this.isRecordFound)
  }


  /**
   * This method is going to edit the existing record from database
   *
   * @author Subhadarshani
   * @since 0.0.1
   */
  save(item: ITypeDetails, type) {
    this.showlertForSave(item, type)
  }
  /**
   * This method is helps in  deleting a particular record from the baby admittedto database
   *
   * @author Subhadarshani
   * @since 0.0.1
   */
  async delete(item: ITypeDetails) {
    let dataFound = false;
    let patientList = await this.storage.get(ConstantProvider.dbKeyNames.patients)
    for (let j = 0; j < patientList.length; j++) {
      if(item.id === patientList[j].babyAdmittedTo){
        dataFound = true
        break
      }
    }
    if(dataFound){
      this.showWarningAlert()
    }else{
      this.showWarningAlertForDelete(item);
    }
   
  }
/**
   * This method is going to show a alert if the selected record is found in registered baby id profiles.
   *
   * @author Subhadarshani
   * @since 0.0.1
   */
  private showWarningAlert(){
    let alert = this.alertController.create({
      title: 'Warning',
      cssClass: '',
      message: ConstantProvider.messages.recordFoundDeletionCanNotBeDoneMsg,
      buttons: [{
        text: "Ok",
        handler: () => {}
      }]
    });
    alert.present();
  }
  /**
   * This method is going to show a warning alert before deletion of recorddelete a particular record from the baby admittedto records
   *
   * @author Subhadarshani
   * @since 0.0.1
   */
  private showWarningAlertForDelete(item) {
    let alert = this.alertController.create({
      title: 'Warning',
      cssClass: '',
      message: ConstantProvider.messages.deletionConfirmMsg,
      buttons: [{
        text: 'Cancel'
      }, {
        text: "Ok",
        handler: () => {
          this.deleteRecord(item)

        }
      }]
    });
    alert.present();
  }
  /**
   * This method is going to delete a particular record from the baby admittedto database
   *
   * @author Subhadarshani
   * @since 0.0.1
   */
  async deleteRecord(item) {    
    let babyAdmittedData = await this.storage.get(ConstantProvider.dbKeyNames.babyAdmittedTo)
      for (let i = 0; i < babyAdmittedData.length; i++) {
        if (babyAdmittedData[i].id === item.id) {
          babyAdmittedData.splice(i, 1);
        }
      }
      this.babyAdmissionList = babyAdmittedData
      this.storage.set(ConstantProvider.dbKeyNames.babyAdmittedTo, this.babyAdmissionList).then(() => {
        this.messageService.showSuccessToast(ConstantProvider.messages.recordDeletedMsg)
      });
      if (this.babyAdmissionList.length == 0) {
        this.isRecordFound = true
      }
    

 
  }
  /**
   *This method will help to show the pop up for editing the record 
   * @author Subhadarshani
   * @since 0.0.1
   */
  showlertForSave(item, type) {
    let itemName: string = ''
    if (item != null) {
      itemName = item.name
    }

    let confirm = this.alertController.create({
      enableBackdropDismiss: false,
      title: "Baby is admitted to",
      message: "",
      inputs: [{
        type: 'text',
        label: "label goes here",
        value: itemName,
        handler: (data) => {
          //console.log("xxyz"+data) 


        }
      }, ],
      buttons: [{
        text: 'Ok',
        handler: (data) => {
          let editedValue = null;
          for (let key in data) {
            editedValue = data[key];
          }
          if (editedValue.length == 0) {
            this.messageService.showErrorToast(ConstantProvider.messages.emptyBabeAdmittedToFieldMsg);
          } else {
            this.saveRecord(item, editedValue, type)
          }


        }
      }, {
        text: 'Cancel',
        handler: (data) => {}
      }]
    });
    confirm.present();
  }
  /**
   *This method will help to save or edit a record in baby admitted to database.
   * @author Subhadarshani
   * @since 0.0.1
   */
  async saveRecord(item, editedValue, type) {
    let data = await this.storage.get(ConstantProvider.dbKeyNames.babyAdmittedTo)
    if (type === 'edit') {
      for (let i = 0; i < data.length; i++) {
        if (data[i].id === item.id) {
          data[i].name = editedValue
        }
      }
      this.babyAdmissionList = data
      this.storage.set(ConstantProvider.dbKeyNames.babyAdmittedTo, this.babyAdmissionList).then(() => {
        this.messageService.showSuccessToast(ConstantProvider.messages.editSuccessMessage)
      });
    } else {
      //new record
      if (this.babyAdmissionList.length == 0) {
        this.settingsService.getDataFromAssetsFolder()
          .subscribe(data => {
            let len = data.typeDetails.length + 1
            //save new record to local database  
            let obj = {
              id: len,
              name: editedValue,
              typeId: ConstantProvider.BabyAdmittedToTypeIds.babyAdmittedToTypeId
            }
            this.babyAdmissionList.push(obj)
            this.storage.set(ConstantProvider.dbKeyNames.babyAdmittedTo, this.babyAdmissionList).then(() => {
              this.messageService.showSuccessToast(ConstantProvider.messages.recordAddedMsg)
              this.isRecordFound = false;
            });
          }, err => {
            this.messageService.showErrorToast(err)

          });
      } else {
        let nameFound = false;
        for (let j = 0; j < this.babyAdmissionList.length; j++) {
          if (editedValue.toLowerCase() == this.babyAdmissionList[j].name.toLocaleLowerCase()) {
            nameFound = true
            break
          }
        }
        if (nameFound) {
          this.messageService.showErrorToast("Record already exists.")
        } else {
          let id = this.babyAdmissionList[this.babyAdmissionList.length - 1].id
          id = id + 1
          let obj = {
            id: id,
            name: editedValue,
            typeId: ConstantProvider.BabyAdmittedToTypeIds.babyAdmittedToTypeId
          }
          this.babyAdmissionList.push(obj)
          this.storage.set(ConstantProvider.dbKeyNames.babyAdmittedTo, this.babyAdmissionList).then(() => {
            this.messageService.showSuccessToast(ConstantProvider.messages.recordAddedMsg)
            this.isRecordFound = false;
          });
        }

      }

    }


  }
}
