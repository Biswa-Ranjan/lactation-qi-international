import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { BfPostDischargeMenuServiceProvider } from '../../providers/bf-post-discharge-menu-service/bf-post-discharge-menu-service';
import { MessageProvider } from '../../providers/message/message';
import { ConstantProvider } from '../../providers/constant/constant';

/**
 * This page will be used to navigate to bf post discharge form with the selected time of 
 * breastfeeding post discharge
 * @author - Naseem Akhtar
 * @since - 0.0.1
 */

@IonicPage()
@Component({
  selector: 'page-bf-post-discharge-menu',
  templateUrl: 'bf-post-discharge-menu.html',
})
export class BfPostDischargeMenuPage {

  babyCode: string;
  timePointList: ITypeDetails[];
  bfStatusPostDischargeList: ITypeDetails[];
  bfpdList: IBFPD[];
  statusPostDischargeConfig: any = {
    title: 'Breastfeeding status post discharge'
  };

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private bfPostDischargeMenuService: BfPostDischargeMenuServiceProvider,
    private messageService: MessageProvider) {}

  ngOnInit() {
    this.babyCode = this.navParams.data.babyCode;
    this.initiateFetchProcess()
  }

  goToPostDischargeForm(menuId: number){
    let dataForPostDischarge: IDataForPostDischargePage = {
      babyCode: this.babyCode,
      menuItemId: menuId,
      deliveryDate: this.navParams.data.deliveryDate,
      dischargeDate: this.navParams.data.dischargeDate
    };
    
    this.navCtrl.push('BfPostDischargePage', dataForPostDischarge);
  }

  initiateFetchProcess() {
    this.bfPostDischargeMenuService.getPostDischargeMenu()
      .subscribe( (timePoints: ITypeDetails[]) => {
        this.timePointList = timePoints;
        this.bfPostDischargeMenuService.getBreastfeedingStatusPostDischarge()
          .subscribe( (status: ITypeDetails[]) => {
            this.bfStatusPostDischargeList = status;

            this.bfPostDischargeMenuService.getBfpdDataFromDB(this.babyCode, this.timePointList,
              this.bfStatusPostDischargeList)
              .then( data => {
                this.bfpdList = data
              },error => console.log(error))
          }, error => {
            this.messageService.showErrorToast(error);
          });
      }, error => {
        this.messageService.showErrorToast(error);
      })
  }

  save() {
    this.bfPostDischargeMenuService.saveUpdateBfpd(this.bfpdList, this.babyCode)
      .then( data => {
        if(data)
          this.messageService.showSuccessToast(ConstantProvider.messages.saveAllString)
      }, error => this.messageService.showErrorToast(error))
      .catch( error => this.messageService.showErrorToast(error))
  }

}
