import { Pipe, PipeTransform } from '@angular/core';

/**
 * Generated class for the OrderByTimeBfspAscPipe pipe.
 *
 * See https://angular.io/api/core/Pipe for more info on Angular Pipes.
 */
@Pipe({
  name: 'orderByTimeBfspAsc',
})
export class OrderByTimeBfspAscPipe implements PipeTransform {
  
  //this method take the list of date and time and transfer with respect to time
  transform(bfsp: IBFSP[], ...args): IBFSP[] {

    //checking whether the list which has been passed is not empty
    if(bfsp != undefined && bfsp != null && bfsp.length > 0){

      let date = bfsp[0].dateOfBFSP;
      bfsp.sort((a: IBFSP, b: IBFSP) => {
        if(date != null && a.timeOfBFSP && b.timeOfBFSP) {
          let day = parseInt(date.split('-')[0])
          let month = parseInt(date.split('-')[1])
          let year = parseInt(date.split('-')[2])

          let hourOfA = parseInt(a.timeOfBFSP.split(':')[0])
          let minuteOfA = parseInt(a.timeOfBFSP.split(':')[1])

          let hourOfB = parseInt(b.timeOfBFSP.split(':')[0])
          let minuteOfB = parseInt(b.timeOfBFSP.split(':')[1])

          // passing year, month, day, hourOfA and minuteOfA to Date()
          let dateOfA: Date = new Date(year, month, day, hourOfA, minuteOfA)
          let dateOfB: Date = new Date(year, month, day, hourOfB, minuteOfB)

          //comparing both the dates.
          if (dateOfA > dateOfB) {
            return 1;
          } else if (a < b) {
            return -1;
          } else {
            return 0;
          }
        }
      });
      return bfsp
    }
    return bfsp
  }
}
