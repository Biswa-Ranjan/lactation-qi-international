import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { BfSupportivePracticePage } from './bf-supportive-practice';
import { PipesModule } from '../../pipes/pipes.module';
import { TooltipsModule } from 'ionic-tooltips';

@NgModule({
  declarations: [
    BfSupportivePracticePage,
  ],
  imports: [
    IonicPageModule.forChild(BfSupportivePracticePage),
    PipesModule,
    TooltipsModule
  ],
})
export class BfSupportivePracticePageModule {}
