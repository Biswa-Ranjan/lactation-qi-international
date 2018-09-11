import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '../../../node_modules/@angular/common';


/**
 *
 * @author {{Ratikanta}} {{ratikanta@sdrc.co.in}}
 * @export
 * @class OrderByDateAscPipe
 * @implements {PipeTransform}
 */
@Pipe({
  name: 'orderByDateAsc',
})
export class OrderByDateAscPipe implements PipeTransform {
  
  constructor(private datePipe: DatePipe){}

  //this method take the list of date and transfer into descending order
  transform(dateLists: IDateList[], ...args):IDateList[] {
  
   
    if(dateLists != undefined && dateLists != null && dateLists.length > 0){

      //Converting to date format to sort
      let dateArray: IDateListDate[] = [];
      dateLists.forEach(d=>{
        if(d != null) {
          let day = parseInt(d.date.split('-')[0])
          let month = parseInt(d.date.split('-')[1]) - 1
          let year = parseInt(d.date.split('-')[2])



          dateArray.push({
            date: new Date(year, month, day),
            noExpressionOccured: d.noExpressionOccured
          })
        }
      })

      //Arranging the dates in descending order
      dateArray.sort((a: IDateListDate, b: IDateListDate) => {
        if (a.date > b.date) {
          return 1;
        } else if (a.date < b.date) {
          return -1;
        } else {
          return 0;
        }
      });

      //converting to dd-MM-yyyy string array format
      dateLists = [];
      dateArray.forEach(d=>{
        dateLists.push({
          date: this.datePipe.transform(d.date, 'dd-MM-yyyy'),
          noExpressionOccured: d.noExpressionOccured 
        })
      })

      return dateLists;
    }

  }
}

/**
 * This interface is going to help us in swapping data
 * @author Ratikanta
 *
 * @interface IDateListDate
 */
interface IDateListDate{
  date: Date,
  noExpressionOccured: boolean
}
