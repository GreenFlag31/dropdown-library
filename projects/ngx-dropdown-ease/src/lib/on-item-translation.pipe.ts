import { Pipe, PipeTransform } from '@angular/core';
import { DropdownDirective } from './dropdown.directive';
import { DropdownItemDirective } from './dropdown-item.directive';
import { InternalDropdownService } from './internalDropdown.service';

@Pipe({
  name: 'onItemTranslation',
  standalone: true,
})
export class OnChangePipe implements PipeTransform {
  constructor(
    private dropdown: DropdownDirective,
    private dropdownItem: DropdownItemDirective,
    private internalDropdownService: InternalDropdownService
  ) {}

  transform(value: string) {
    this.internalDropdownService.translateItems(
      this.dropdown,
      value,
      this.dropdownItem.itemID
    );

    return value;
  }
}
