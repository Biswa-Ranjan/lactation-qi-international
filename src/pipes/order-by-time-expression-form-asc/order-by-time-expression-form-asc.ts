import { Pipe, PipeTransform } from '@angular/core';
import { ConstantProvider } from '../../providers/constant/constant';

/**
 * Generated class for the OrderByTimeExpressionFormAscPipe pipe.
 *
 * See https://angular.io/api/core/Pipe for more info on Angular Pipes.
 */
@Pipe({
  name: 'orderByTimeExpressionFormAsc',
})
export class OrderByTimeExpressionFormAscPipe implements PipeTransform {

  //this method take the list of date and time and transfer with respect to time
  transform(expressionForm: IBFExpression[], filterBy: string): IBFExpression[] {

    //checking whether the list which has been passed is not empty
    if(expressionForm != undefined && expressionForm != null && expressionForm.length > 0){

      // let date = expressionForm[0].dateOfExpression
      expressionForm.sort((a: IBFExpression, b: IBFExpression) => {
        if(a.dateOfExpression && b.dateOfExpression && a.timeOfExpression && b.timeOfExpression) {
          let dateA = a.dateOfExpression.split('-')
          let dateB = b.dateOfExpression.split('-')
          let timeA = a.timeOfExpression.split(':')
          let timeB = b.timeOfExpression.split(':')

          // let day = parseInt(dateA[0])
          // let month = parseInt(dateA[1])
          // let year = parseInt(dateA[2])

          // let hourOfA = parseInt(a.timeOfExpression.split(':')[0])
          // let minuteOfA = parseInt(a.timeOfExpression.split(':')[1])

          // let hourOfB = parseInt(b.timeOfExpression.split(':')[0])
          // let minuteOfB = parseInt(b.timeOfExpression.split(':')[1])

          // passing year, month, day, hourOfA and minuteOfA to Date()
          let dateOfA: Date = new Date(+dateA[0], +dateA[1] + 1, +dateA[2], +timeA[0], +timeA[1])
          let dateOfB: Date = new Date(+dateB[0], +dateB[1] + 1, +dateB[2], +timeB[0], +timeB[1])

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

      if(filterBy) {
        let x = filterBy.split('^')
        if(+x[1] === ConstantProvider.MethodOfExpressionBfTypeId.methodOfExpressionBfTypeId)
          return expressionForm.filter(d => d.methodOfExpression === +x[0])
        else
          return expressionForm.filter(d => d.locationOfExpression === +x[0])
      }else
        return expressionForm
    }
    return expressionForm
  }
}
