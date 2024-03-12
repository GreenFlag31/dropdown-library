import { Pipe, PipeTransform } from '@angular/core';
import { DropdownDirective } from './dropdown.directive';
import { InternalDropdownService } from './internalDropdown.service';

@Pipe({
  name: 'onTitleTranslation',
  standalone: true,
})
export class OnTitleTranslationPipe implements PipeTransform {
  constructor(
    private dropdown: DropdownDirective,
    private internalDropdownService: InternalDropdownService
  ) {}

  transform(value: string) {
    this.internalDropdownService.translateTitle(this.dropdown, value);
    return value;
  }
}
