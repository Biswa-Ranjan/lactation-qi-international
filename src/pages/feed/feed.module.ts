import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { FeedPage } from './feed';
import { PipesModule } from '../../pipes/pipes.module';
import { TooltipsModule } from '../../../node_modules/ionic-tooltips';

@NgModule({
  declarations: [
    FeedPage,
  ],
  imports: [
    IonicPageModule.forChild(FeedPage),
    PipesModule,
    TooltipsModule
  ],
})
export class FeedPageModule {}
