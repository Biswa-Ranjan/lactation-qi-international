import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '../../../node_modules/@angular/common';

/**
 * Generated class for the OrderByDateAscPipe pipe.
 *
 * See https://angular.io/api/core/Pipe for more info on Angular Pipes.
 */
@Pipe({
  name: 'orderByDateAsc',
})
export class OrderByDateAscPipe implements PipeTransform {
  
  constructor(private datePipe: DatePipe){}

  //this method take the list of date and transfer into descending order
  transform(dateStringArray: string[], ...args):string[] {

    if(dateStringArray != undefined || dateStringArray != null){

      //Converting to date format to sort
      let dateArray: Date[] = [];
      dateStringArray.forEach(d=>{
        if(d != null) {
          let day = parseInt(d.split('-')[0])
          let month = parseInt(d.split('-')[1]) - 1
          let year = parseInt(d.split('-')[2])

          dateArray.push(new Date(year, month, day))
        }
      })

      //Arranging the dates in descending order
      dateArray.sort((a: Date, b: Date) => {
        if (a > b) {
          return 1;
        } else if (a < b) {
          return -1;
        } else {
          return 0;
        }
      });

      //converting to dd-MM-yyyy string array format
      dateStringArray = [];
      dateArray.forEach(d=>{
        dateStringArray.push(this.datePipe.transform(d, 'dd-MM-yyyy'))
      })

      return dateStringArray;
    }

  }
}
