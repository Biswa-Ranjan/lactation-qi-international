import { NgModule } from '@angular/core';
import { OrderByDatePipe } from './order-by-date/order-by-date';
import { OrderByTimePipe } from './order-by-time/order-by-time';
import { SortPatientPipe } from './sort-patient/sort-patient';
import { SearchPipe } from './search/search';
import { OrderByTimeBfspPipe } from './order-by-time-bfsp/order-by-time-bfsp';
import { OrderByTimeExpressionFromPipe } from './order-by-time-expression-from/order-by-time-expression-from';
import { OrderAreaByNamePipe } from './order-area-by-name/order-area-by-name';
import { OrderByTimeBfspAscPipe } from './order-by-time-bfsp-asc/order-by-time-bfsp-asc';
import { OrderByTimeExpressionFormAscPipe } from './order-by-time-expression-form-asc/order-by-time-expression-form-asc';
import { OrderByTimeAscPipe } from './order-by-time-asc/order-by-time-asc';
@NgModule({
	declarations: [OrderByDatePipe,
    OrderByTimePipe,
    SortPatientPipe,
    SearchPipe,
    OrderByTimeBfspPipe,
    OrderByTimeExpressionFromPipe,
    OrderAreaByNamePipe,
    OrderByTimeBfspAscPipe,
    OrderByTimeExpressionFormAscPipe,
    OrderByTimeAscPipe],
	imports: [],
	exports: [OrderByDatePipe,
    OrderByTimePipe,
    SortPatientPipe,
    SearchPipe,
    OrderByTimeBfspPipe,
    OrderByTimeExpressionFromPipe,
    OrderAreaByNamePipe,
    OrderByTimeBfspAscPipe,
    OrderByTimeExpressionFormAscPipe,
    OrderByTimeAscPipe]
})
export class PipesModule {}
