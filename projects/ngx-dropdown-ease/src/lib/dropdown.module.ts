import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DropdownDirective,
  DropdownTitleDirective,
} from './dropdown.directive';
import { DropdownTitleContainerDirective } from './dropdown-title-container.directive';
import { DropdownItemDirective } from './dropdown-item.directive';
import { DropdownMenuDirective } from './dropdown-menu.directive';
import { OnChangePipe } from './on-item-translation.pipe';
import { OnTitleTranslationPipe } from './on-title-translation.pipe';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    DropdownDirective,
    DropdownTitleContainerDirective,
    DropdownTitleDirective,
    DropdownMenuDirective,
    DropdownItemDirective,
    OnChangePipe,
    OnTitleTranslationPipe,
  ],
  exports: [
    DropdownDirective,
    DropdownTitleContainerDirective,
    DropdownTitleDirective,
    DropdownMenuDirective,
    DropdownItemDirective,
    OnChangePipe,
    OnTitleTranslationPipe,
  ],
})
export class DropdownModule {}
