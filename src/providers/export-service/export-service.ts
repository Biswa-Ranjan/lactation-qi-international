import { Injectable } from '@angular/core';
import { PapaParseService } from 'ngx-papaparse';
import { MessageProvider } from '../message/message';
import { ConstantProvider } from '../constant/constant';
import { Storage } from '@ionic/storage';
import { File } from '@ionic-native/file'
import { DatePipe } from '@angular/common';
import { UtilServiceProvider } from '../util-service/util-service';
import { UserServiceProvider } from '../user-service/user-service';
import { OrderByTimePipe } from '../../pipes/order-by-time/order-by-time';
import { OrderByTimeExpressionFromPipe } from '../../pipes/order-by-time-expression-from/order-by-time-expression-from';
import { SortPatientPipe } from '../../pipes/sort-patient/sort-patient';
import { OrderByTimeBfspPipe } from '../../pipes/order-by-time-bfsp/order-by-time-bfsp';
import * as XLSX from 'xlsx';
import { LactationProvider } from '../lactation/lactation';


/**
 * This provider is going to deal with codes which are going to help in exporting data to csv
 *
 * @export
 * @class ExportServiceProvider
 * @since 1.2.0
 * @author Ratikanta
 * @author Naseem
 */
@Injectable()
export class ExportServiceProvider {

  dataToExport;
  folder_name;
  file_name;
  wb: XLSX.WorkBook;
  constructor(private papa: PapaParseService,
    private messageService: MessageProvider,
    private storage: Storage, private file: File,
    private datePipe: DatePipe,
    private utilService: UtilServiceProvider,
    private userService: UserServiceProvider,
    private lactationService: LactationProvider) {}

  /**
   * This method is going to have all the business logic to export data from app to android device root folder
   * @since 1.2.0
   * @author Ratikanta
   */
  async export() {
    this.messageService.showLoader(ConstantProvider.messages.exportingData)
    this.wb = XLSX.utils.book_new()
    await this.setDataToExport()

    try {
      let fileName = 'Lactation_' + this.utilService.getAreaShortNameById(this.userService.getUser().institution) +"_"+ this.datePipe.transform(new Date(), 'dd-MM-yyyy HHmm') + ".xlsx"

      if(this.lactationService.getPlatform().isWebPWA) {
        setTimeout( d => {
          XLSX.writeFile(this.wb, fileName)
          this.messageService.stopLoader()
        }, 2000)
          
      }else if(this.lactationService.getPlatform().isAndroid) {
        // let result = await this.createFolderAndFile()
        // if (result){
        //   await this.writeDataToFile()
        // }else{
        //   this.messageService.stopLoader()
        // }
        this.exportToMobileDevice(fileName)
      }else {
        this.messageService.showOkAlert('Export Error', 'Platform not supported')
        this.messageService.stopLoader()
      }
      
    } catch (error) {
      console.log(error)
    }
  }

  /**
   *
   * This method is going to set the data which we are going to export
   * @memberof ExportServiceProvider
   * @since 1.2.0
   * @author Ratikanta
   * @author Naseem Akhtar (naseem@sdrc.co.in)
   */
  async setDataToExport() {
    let data: any[] = []
    //making the data object
    this.dataToExport = {
      data: data
    }

    let patientSheet = XLSX.utils.aoa_to_sheet(await this.getPatients(data.slice()))
    let bfExpSheet = XLSX.utils.aoa_to_sheet(await this.getBFExpressions(data.slice()))
    let bfspSheet = XLSX.utils.aoa_to_sheet(await this.getBFSPs(data.slice()))
    let logFeedSheet = XLSX.utils.aoa_to_sheet(await this.getFeedExpressions(data.slice()))
    let bfpdSheet = XLSX.utils.aoa_to_sheet(await this.getBFPDs(data.slice()))
    let userSheet = XLSX.utils.aoa_to_sheet(await this.getUsers(data.slice()))

    XLSX.utils.book_append_sheet(this.wb, patientSheet, ConstantProvider.exportSheetNames.patient);
    XLSX.utils.book_append_sheet(this.wb, bfExpSheet, ConstantProvider.exportSheetNames.bfExpression);
    XLSX.utils.book_append_sheet(this.wb, bfspSheet, ConstantProvider.exportSheetNames.bfsp);
    XLSX.utils.book_append_sheet(this.wb, logFeedSheet, ConstantProvider.exportSheetNames.logFeed);
    XLSX.utils.book_append_sheet(this.wb, bfpdSheet, ConstantProvider.exportSheetNames.bfpd);
    XLSX.utils.book_append_sheet(this.wb, userSheet, ConstantProvider.exportSheetNames.user);

  }

  async exportToMobileDevice(fileName) {
    debugger
    try{
      let fileToArray = XLSX.write(this.wb, { type: 'array' })
      await this.file.writeFile(this.file.externalRootDirectory + ConstantProvider.appFolderName, fileName, fileToArray, {
        replace: true,
        append: false
      })
      this.messageService.stopLoader()
      this.messageService.showOkAlert(ConstantProvider.messages.dataExported,
        ConstantProvider.messages.dataExportSuccessful + '<br/><br/>' + 
        ConstantProvider.appFolderName + '\\' + fileName)
    }catch(error) {
      this.messageService.stopLoader()
      this.messageService.showErrorToast(ConstantProvider.messages.couldNotWriteToFile)
    }
    
  }


  /**
   *
   * This method is going to create files and folders where we are going to keep the data
   * @memberof ExportServiceProvider
   * @returns Promise<boolean> value, returns true,  if folder and file both created successfully.
   * Returns false if folder and file could ot create successfully
   * @since 1.2.0
   * @author Ratikanta
   */
  async createFolderAndFile(): Promise<boolean> {

    try {
      this.folder_name = ConstantProvider.appFolderName;
      this.userService.getUser().institution
      this.file_name = 'Lactation_' + this.utilService.getAreaShortNameById(this.userService.getUser().institution) +"_"+ this.datePipe.transform(new Date(), 'dd-MM-yyyy HHmm') + ".csv"

      //creating file
      await this.file.createFile(this.file.externalRootDirectory + "/" + this.folder_name, this.file_name, true)
      return true
    } catch (err) {
      this.messageService.stopLoader()
      this.messageService.showErrorToast(ConstantProvider.messages.couldNotCreateFile)
      return false
    }


  }


  /**
   *
   * This method is going to write the data into file
   * @memberof ExportServiceProvider
   * @since 1.2.0
   * @author Ratikanta
   */
  async writeDataToFile() {

    try {
      let csvData = this.papa.unparse(this.dataToExport);

      await this.file.writeFile(this.file.externalRootDirectory + "/" + this.folder_name, this.file_name, csvData,
        { replace: true, append: false })

      this.messageService.stopLoader()
      this.messageService.showOkAlert(ConstantProvider.messages.dataExported, ConstantProvider.messages.dataExportSuccessful + '<br/><br/>' + this.folder_name + '\\' + this.file_name)
    } catch (err) {
      this.messageService.stopLoader()
      this.messageService.showErrorToast(ConstantProvider.messages.couldNotWriteToFile)
    }


  }


  /**
   *
   * This method is going to give all patient records present in the database
   * @memberof ExportServiceProvider
   * @since 1.2.0
   * @author Ratikanta
   */
  async getPatients(data: any[]) {


    //setting header
    let row: any[] = []
    row.push('Baby ID')
    row.push('Baby ID by hospital')
    row.push("Mother's age")
    row.push("Baby of (mother's name)")
    row.push('Delivery date')
    row.push('Delivery time')
    row.push('Delivery method')
    row.push("Baby's weight in grams")
    row.push('Gestational age in weeks')
    row.push("Mother's prenatal intent to provide milk")
    row.push("Parent's knowledge on human milk and lactation")
    row.push('Time till first expression in hours')
    row.push('Inpatient/Outpatient')
    row.push('Admission date (Outborn patients)')
    row.push('Baby is admitted to')
    row.push('Reason for NICU admission')
    row.push('Date of discharge')
    row.push('Is synced')
    row.push('Created by')
    row.push('Created date')
    row.push('Updated date')
    row.push('UUID')

    data.push(row)

    //getting data from database
    let patients: IPatient[] = await this.storage.get(ConstantProvider.dbKeyNames.patients);
    patients = new SortPatientPipe().transform(patients,ConstantProvider.patientSortBy.deliveryDateDescending)
    if (patients != null) {

      //Looping over patients and setting it in data
      patients.forEach(patient => {
        row = []
        //Setting all column value
        row.push(patient.babyCode)
        row.push(patient.babyCodeHospital ? patient.babyCodeHospital: '')
        row.push(patient.mothersAge ? patient.mothersAge: '')
        row.push(patient.babyOf ? patient.babyOf: '')
        row.push(patient.deliveryDate)
        row.push(patient.deliveryTime)
        row.push(patient.deliveryMethod ? this.utilService.getTypeDetailName(patient.deliveryMethod): '')
        row.push(patient.babyWeight ? patient.babyWeight: '')
        row.push(patient.gestationalAgeInWeek ? patient.gestationalAgeInWeek: '')
        row.push(patient.mothersPrenatalIntent ? this.utilService.getTypeDetailName(patient.mothersPrenatalIntent): '')
        row.push(patient.parentsKnowledgeOnHmAndLactation ? this.utilService.getTypeDetailName(patient.parentsKnowledgeOnHmAndLactation): '')
        row.push(patient.timeTillFirstExpressionInHour ? patient.timeTillFirstExpressionInHour + ":" + patient.timeTillFirstExpressionInMinute: '')
        row.push(patient.inpatientOrOutPatient ? this.utilService.getTypeDetailName(patient.inpatientOrOutPatient): '')
        row.push(patient.admissionDateForOutdoorPatients ? patient.admissionDateForOutdoorPatients: '')
        row.push(patient.babyAdmittedTo ? this.utilService.getTypeDetailName(patient.babyAdmittedTo): '')

        let nicuAddmissionReason: string = "";
        if(patient.nicuAdmissionReason){

          patient.nicuAdmissionReason.toString().split(',').forEach(reason => {
            nicuAddmissionReason += this.utilService.getTypeDetailName(parseInt(reason));
            nicuAddmissionReason += ", "
          });

          nicuAddmissionReason = nicuAddmissionReason.substring(0, nicuAddmissionReason.length - 2)
        }

        row.push(patient.nicuAdmissionReason ? nicuAddmissionReason: '')
        row.push(patient.dischargeDate ? patient.dischargeDate: '')
        row.push(patient.isSynced ? 'Yes':'No')
        row.push(patient.userId)
        row.push(this.datePipe.transform(new Date(patient.createdDate), 'dd-MM-yyyy HH:mm'))
        row.push(this.datePipe.transform(new Date(patient.updatedDate), 'dd-MM-yyyy HH:mm'))
        row.push(patient.uuidNumber ? patient.uuidNumber: '')

        //Pushing into data
        data.push(row)
      });
    }

    return data
  }


  /**
   *
   * This method is going to give all bf expression records present in the database
   * @memberof ExportServiceProvider
   * @since 1.2.0
   * @author Ratikanta
   */
  async getBFExpressions(data: any[]) {

    let row: any[] = []
    
    //setting headers
    row.push('Baby ID')
    row.push('Date of expression')
    row.push('Time of expression')
    row.push('Method of expression')
    row.push('Location where expression occurred')
    row.push('Volume of milk expressed from left and right breast (in ml)')
    row.push('Is synced')
    row.push('Created by')
    row.push('Created date')
    row.push('Updated date')
    row.push('UUID')

    data.push(row)

    //getting bf expressions from database
    let bfExpressions: IBFExpression[] = await this.storage.get(ConstantProvider.dbKeyNames.bfExpressions);
    bfExpressions = new OrderByTimeExpressionFromPipe().transform(bfExpressions)
    if (bfExpressions != null) {

      //Looping over bf expressions and setting it in data
      bfExpressions.forEach(bfExpression => {
        row = []
        //Setting all column value
        row.push(bfExpression.babyCode)
        row.push(bfExpression.dateOfExpression)
        row.push(bfExpression.timeOfExpression)
        row.push(bfExpression.methodOfExpression ? this.utilService.getTypeDetailName(bfExpression.methodOfExpression): '')
        row.push(bfExpression.locationOfExpression ? this.utilService.getTypeDetailName(bfExpression.locationOfExpression): '')
        row.push(bfExpression.volOfMilkExpressedFromLR ? bfExpression.volOfMilkExpressedFromLR: '')
        row.push(bfExpression.isSynced ? 'Yes':'No')
        row.push(bfExpression.userId)
        row.push(this.datePipe.transform(new Date(bfExpression.createdDate), 'dd-MM-yyyy HH:mm'))
        row.push(this.datePipe.transform(new Date(bfExpression.updatedDate), 'dd-MM-yyyy HH:mm'))
        row.push(bfExpression.uuidNumber ? bfExpression.uuidNumber: '')

        //Pushing into data
        data.push(row)
      });
    }
    return data
  }


  /**
   *
   * This method is going to give all BFSP records present in the database
   * @memberof ExportServiceProvider
   * @since 1.2.0
   * @author Ratikanta
   */
  async getBFSPs(data: any[]) {

    //setting header
    let row: any[] = []
    row.push('Baby ID')
    row.push('Date of BFSP')
    row.push('Time at which BFSP occurred')
    row.push('Breast feeding supportive practice performed')
    row.push('Person who performed the BFSP')
    row.push('Duration of BFSP performed in minutes')
    row.push('Is synced')
    row.push('Created by')
    row.push('Created date')
    row.push('Updated date')
    row.push('UUID')

    data.push(row)


    //getting bf expressions from database
    let bfsps: IBFSP[] = await this.storage.get(ConstantProvider.dbKeyNames.bfsps);
    bfsps = new OrderByTimeBfspPipe().transform(bfsps)
    if (bfsps != null) {

      //Looping over bfsps and setting it in data
      bfsps.forEach(bfsp => {
        row = []
        //Setting all column value
        row.push(bfsp.babyCode)
        row.push(bfsp.dateOfBFSP)
        row.push(bfsp.timeOfBFSP)
        row.push(bfsp.bfspPerformed ? this.utilService.getTypeDetailName(bfsp.bfspPerformed): '')
        row.push(bfsp.personWhoPerformedBFSP ? this.utilService.getTypeDetailName(bfsp.personWhoPerformedBFSP): '')
        row.push(bfsp.bfspDuration ? bfsp.bfspDuration: '')
        row.push(bfsp.isSynced ? 'Yes':'No')
        row.push(bfsp.userId)
        row.push(this.datePipe.transform(new Date(bfsp.createdDate), 'dd-MM-yyyy HH:mm'))
        row.push(this.datePipe.transform(new Date(bfsp.updatedDate), 'dd-MM-yyyy HH:mm'))
        row.push(bfsp.uuidNumber ? bfsp.uuidNumber: '')

        //Pushing into data
        data.push(row)
      });
    }
    return data
  }



  /**
   *
   * This method is going to give all log feed records present in the database
   * @memberof ExportServiceProvider
   * @since 1.2.0
   * @author Ratikanta
   */
  async getFeedExpressions(data: any[]) {

    //setting header
    let row: any[] = []
    row.push('Baby ID')
    row.push('Date of feed')
    row.push('Time of feed')
    row.push('Method of feed')
    row.push('Volume OMM')
    row.push('Volume DHM')
    row.push('Volume Formula')
    row.push('Volume Animal Milk')
    row.push('Volume Other')
    row.push('Location of feeding')
    row.push('Weight of baby in grams')
    row.push('Is synced')
    row.push('Created by')
    row.push('Created date')
    row.push('Updated date')
    row.push('UUID')

    data.push(row)

    //getting log feed from database
    let feedExpressions: IFeed[] = await this.storage.get(ConstantProvider.dbKeyNames.feedExpressions);
    feedExpressions = new OrderByTimePipe().transform(feedExpressions)
    if (feedExpressions != null) {

      //Looping over feed expressions and setting it in data
      feedExpressions.forEach(feedExpression => {
        row = []
        //Setting all column value
        row.push(feedExpression.babyCode)
        row.push(feedExpression.dateOfFeed)
        row.push(feedExpression.timeOfFeed)
        row.push(feedExpression.methodOfFeed ? this.utilService.getTypeDetailName(feedExpression.methodOfFeed): '')
        row.push(feedExpression.ommVolume ? feedExpression.ommVolume: '')
        row.push(feedExpression.dhmVolume ? feedExpression.dhmVolume: '')
        row.push(feedExpression.formulaVolume ? feedExpression.formulaVolume: '')
        row.push(feedExpression.animalMilkVolume ? feedExpression.animalMilkVolume: '')
        row.push(feedExpression.otherVolume ? feedExpression.otherVolume: '')
        row.push(feedExpression.locationOfFeeding ? this.utilService.getTypeDetailName(feedExpression.locationOfFeeding): '')
        row.push(feedExpression.babyWeight ? feedExpression.babyWeight: '')
        row.push(feedExpression.isSynced ? 'Yes':'No')
        row.push(feedExpression.userId)
        row.push(this.datePipe.transform(new Date(feedExpression.createdDate), 'dd-MM-yyyy HH:mm'))
        row.push(this.datePipe.transform(new Date(feedExpression.updatedDate), 'dd-MM-yyyy HH:mm'))
        row.push(feedExpression.uuidNumber ? feedExpression.uuidNumber: '')

        //Pushing into data
        data.push(row)
      });
    }

    return data
  }


  /**
   *
   * This method is going to give all BFPD records present in the database
   * @memberof ExportServiceProvider
   * @since 1.2.0
   * @author Ratikanta
   */
  async getBFPDs(data: any[]) {

    //setting header
    let row: any[] = []
    row.push('Baby ID')
    row.push('Date of breastfeeding post-discharge')
    row.push('Time of breastfeeding post discharge')
    row.push('Breastfeeding status post discharge')
    row.push('Is synced')
    row.push('Created by')
    row.push('Created date')
    row.push('Updated date')
    row.push('UUID')

    data.push(row)

    //getting bf expressions post discharge from database
    let bfpds: IBFPD[] = await this.storage.get(ConstantProvider.dbKeyNames.bfpds);
    if (bfpds != null) {

      //Looping over bfpds and setting it in data
      bfpds.forEach(bfpd => {
        row = []
        //Setting all column value
        row.push(bfpd.babyCode)
        row.push(bfpd.dateOfBreastFeeding)
        row.push(bfpd.timeOfBreastFeeding ? this.utilService.getTypeDetailName(bfpd.timeOfBreastFeeding): '')
        row.push(bfpd.breastFeedingStatus ? this.utilService.getTypeDetailName(bfpd.breastFeedingStatus): '')
        row.push(bfpd.isSynced ? 'Yes':'No')
        row.push(bfpd.userId)
        row.push(this.datePipe.transform(new Date(bfpd.createdDate), 'dd-MM-yyyy HH:mm'))
        row.push(this.datePipe.transform(new Date(bfpd.updatedDate), 'dd-MM-yyyy HH:mm'))
        row.push(bfpd.uuidNumber ? bfpd.uuidNumber: '')

        //Pushing into data
        data.push(row)
      });
    }
    return data
  }



  /**
   *
   * This method is going to give all patient records present in the database
   * @memberof ExportServiceProvider
   * @since 1.2.0
   * @author Ratikanta
   */
  async getUsers(data: any[]) {

    let row: any[] = []
    row.push('First Name')
    row.push('Last Name')
    row.push('Email')
    row.push('Country')
    row.push('State')
    row.push('District')
    row.push('Institution Name')
    row.push('Is synced')
    row.push('Created date')
    row.push('Updated date')
    row.push('UUID')

    data.push(row)

    //getting users from database
    let users: IUser[] = await this.storage.get(ConstantProvider.dbKeyNames.users);
    if (users != null) {

      //Looping over users and setting it in data
      users.forEach(user => {
        row = []
        //Setting all column value
        row.push(user.firstName)
        row.push(user.lastName)
        row.push(user.email)
        row.push(this.utilService.getAreaNameById(user.country))
        row.push(this.utilService.getAreaNameById(user.state))
        row.push(this.utilService.getAreaNameById(user.district))
        row.push(this.utilService.getAreaNameById(user.institution))
        row.push(user.isSynced ? 'Yes':'No')
        row.push(this.datePipe.transform(new Date(user.createdDate), 'dd-MM-yyyy HH:mm'))
        row.push(this.datePipe.transform(new Date(user.updatedDate), 'dd-MM-yyyy HH:mm'))
        row.push(user.uuidNumber ? user.uuidNumber: '')

        //Pushing into data
        data.push(row)
      });
    }

    return data
  }

}
