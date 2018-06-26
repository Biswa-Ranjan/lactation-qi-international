import { Pipe, PipeTransform } from '@angular/core';
import { ConstantProvider } from '../../providers/constant/constant';

/**
 * This pipe will sort the given list of data based on sort by
 *
 * @author Jagat Bandhu
 * @since 0.0.1
 */
@Pipe({
  name: 'sortPatient',
})
export class SortPatientPipe implements PipeTransform {


  transform(patients: IPatient[], ...args): IPatient[] {

    if(patients != undefined && patients != null && patients.length > 0){
      switch(args[0]){
        case ConstantProvider.patientSortBy.deliveryDateDescending:
        patients.sort((a: IPatient, b: IPatient) => {
          let dayOfA = parseInt(a.deliveryDate.split('-')[0])
          let monthOfA = parseInt(a.deliveryDate.split('-')[1])
          let yearOfA = parseInt(a.deliveryDate.split('-')[2])

          let dayOfB = parseInt(b.deliveryDate.split('-')[0])
          let monthOfB = parseInt(b.deliveryDate.split('-')[1])
          let yearOfB = parseInt(b.deliveryDate.split('-')[2])

          let hourOfA = parseInt(a.deliveryTime.split(':')[0])
          let minuteOfA = parseInt(a.deliveryTime.split(':')[1])

          let hourOfB = parseInt(b.deliveryTime.split(':')[0])
          let minuteOfB = parseInt(b.deliveryTime.split(':')[1])

          let dateOfA: Date = new Date(yearOfA, monthOfA, dayOfA, hourOfA, minuteOfA)
          let dateOfB: Date = new Date(yearOfB, monthOfB, dayOfB, hourOfB, minuteOfB)

          if (dateOfA < dateOfB) {
            return 1;
          } else if (dateOfA > dateOfB) {
            return -1;
          } else {
            return 0;
          }
        });
        break;
        case ConstantProvider.patientSortBy.deliveryDateAscending:
        patients.sort((a: IPatient, b: IPatient) => {
          let dayOfA = parseInt(a.deliveryDate.split('-')[0])
          let monthOfA = parseInt(a.deliveryDate.split('-')[1])
          let yearOfA = parseInt(a.deliveryDate.split('-')[2])

          let dayOfB = parseInt(b.deliveryDate.split('-')[0])
          let monthOfB = parseInt(b.deliveryDate.split('-')[1])
          let yearOfB = parseInt(b.deliveryDate.split('-')[2])

          let hourOfA = parseInt(a.deliveryTime.split(':')[0])
          let minuteOfA = parseInt(a.deliveryTime.split(':')[1])

          let hourOfB = parseInt(b.deliveryTime.split(':')[0])
          let minuteOfB = parseInt(b.deliveryTime.split(':')[1])

          let dateOfA: Date = new Date(yearOfA, monthOfA, dayOfA, hourOfA, minuteOfA)
          let dateOfB: Date = new Date(yearOfB, monthOfB, dayOfB, hourOfB, minuteOfB)

          if (dateOfA > dateOfB) {
            return 1;
          } else if (dateOfA < dateOfB) {
            return -1;
          } else {
            return 0;
          }
        });
        break;
      }
      return patients;
    }
  }
  /**
 * This method will sort Baby Id .
 * @author Subhadarshani
 * @since 0.0.1
 */
  sortByBabyd(patients: IPatient[], ...args): IPatient[] {
    if(patients != undefined && patients != null && patients.length > 0){
      let reA = /[^a-zA-Z]/g;
      let reN = /[^0-9]/g;
        patients.sort((a: IPatient, b: IPatient) => {
          if(a.babyCode!=null && b.babyCode!=null){
            let aA = a.babyCode.replace(reA, "");
            let bA = b.babyCode.replace(reA, "");
            if(aA === bA) {
              var aN = parseInt(a.babyCode.replace(reN, ""), 10);
              var bN = parseInt(b.babyCode.replace(reN, ""), 10);
              return aN === bN ? 0 : aN > bN ? 1 : -1;
          } else {
              return aA > bA ? 1 : -1;
          }    
          }         
                
        });
      
      }
      return patients;
    }
  
 
}
