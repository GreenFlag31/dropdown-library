import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DropdownDirective,
  DropdownTitleDirective,
} from './dropdown.directive';
import { DropdownTitleContainerDirective } from './dropdown-title-container.directive';
import { DropdownItemDirective } from './dropdown-item.directive';
import { DropdownMenuDirective } from './dropdown-menu.directive';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    DropdownDirective,
    DropdownTitleContainerDirective,
    DropdownTitleDirective,
    DropdownMenuDirective,
    DropdownItemDirective,
  ],
  exports: [
    DropdownDirective,
    DropdownTitleContainerDirective,
    DropdownTitleDirective,
    DropdownMenuDirective,
    DropdownItemDirective,
  ],
})
export class DropdownModule {}
