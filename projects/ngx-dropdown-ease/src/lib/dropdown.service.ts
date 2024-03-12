import { Injectable } from '@angular/core';
import { InternalDropdownService } from './internalDropdown.service';
import { Dropdown } from './interface';

@Injectable({
  providedIn: 'root',
})
export class DropdownService {
  constructor(private internalDropdownService: InternalDropdownService) {}

  /**
   * Get all active dropdowns.
   * @returns An array of Dropdown
   * ```
   * interface Dropdown {
   * element: HTMLElement;
   * itemsValue: string[];
   * activesValue: string[];
   * activesIndex: number[];
   * labelMinimumSelection: boolean;
   * selection: 'single' | 'multiple';
   * translation: boolean;
   * }
   * ```
   */
  getDropdowns() {
    const dropdownsData = this.internalDropdownService.getActiveDropdowns();
    const dropdowns: Dropdown[] = [];

    for (const dropdown of dropdownsData) {
      const itemsValue: string[] = [];
      const activesValue: string[] = [];
      const dropdownDirective = dropdown.element;
      const menu = dropdown.element.dropdownMenu;
      const { translation, activesIndex } = dropdown;

      for (const item of dropdownDirective.dropdownItems) {
        const nativeText = item.native.innerText;
        itemsValue.push(nativeText);
        if (activesIndex.includes(item.itemID)) {
          activesValue.push(nativeText);
        }
      }

      dropdowns.push({
        element: dropdown.element.native,
        itemsValue,
        activesValue,
        activesIndex,
        labelMinimumSelection: menu.minNumberElementsSelection > 0,
        selection: dropdown.element.selection,
        translation,
      });
    }

    return dropdowns;
  }
}
