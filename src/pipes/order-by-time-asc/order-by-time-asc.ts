import { Pipe, PipeTransform } from '@angular/core';

/**
 * Generated class for the OrderByTimeAscPipe pipe.
 *
 * See https://angular.io/api/core/Pipe for more info on Angular Pipes.
 */
@Pipe({
  name: 'orderByTimeAsc',
})
export class OrderByTimeAscPipe implements PipeTransform {
  
  //this method take the list of date and time and transfer with respect to time
  transform(feedExpressions: IFeed[], filterBy: string): IFeed[] {

    //checking whether the list which has been passed is not empty
    if(feedExpressions != undefined && feedExpressions != null && feedExpressions.length > 0) {

      let date = feedExpressions[0].dateOfFeed
      feedExpressions.sort((a: IFeed, b: IFeed) => {
        if(date != null && a.timeOfFeed && b.timeOfFeed) {
          let day = parseInt(date.split('-')[0])
          let month = parseInt(date.split('-')[1])
          let year = parseInt(date.split('-')[2])

          let hourOfA = parseInt(a.timeOfFeed.split(':')[0])
          let minuteOfA = parseInt(a.timeOfFeed.split(':')[1])

          let hourOfB = parseInt(b.timeOfFeed.split(':')[0])
          let minuteOfB = parseInt(b.timeOfFeed.split(':')[1])

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

      if(filterBy != null)
        return feedExpressions.filter(d => d.methodOfFeed === +filterBy)
      else
        return feedExpressions
    }
    return feedExpressions
  }
}
