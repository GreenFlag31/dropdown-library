import { ElementRef, Injectable } from '@angular/core';
import { InternalDropdownService } from './internalDropdown.service';
import { Dropdown, TranslatedValues } from './interface';

@Injectable({
  providedIn: 'root',
})
export class DropdownService {
  constructor(private internalDropdownService: InternalDropdownService) {}

  /**
   * Initialise the translation at start.
   * @param translatedValues
   * ```
   * interface TranslatedValues {
   *  dropdown: ElementRef;
   *  title: string;
   *  items: string[];
   * }
   * ```
   */
  translate(translatedValues: TranslatedValues[]) {
    this.internalDropdownService.translate(translatedValues);
  }

  /**
   * Get the list of the elements of the dropdown.
   * @param dropdown The ElementRef of the dropdown.
   * @returns An array of your HTML text elements.
   * Iterate over and translate its content with your third party library.
   */
  getListOfElements(dropdown: ElementRef) {
    return this.internalDropdownService.getListOfElements(dropdown);
  }

  /**
   * Get all active dropdowns.
   * @returns An array of Dropdown
   * ```
   * interface Dropdown {
   *  element: HTMLElement;
   *  itemsValue: string[];
   *  activesValue: string[];
   *  labelMinimumSelection: boolean;
   *  selection: 'single' | 'multiple';
   *  translation: boolean;
   * }
   * ```
   */
  getDropdowns() {
    const dropdownsData = this.internalDropdownService.getActiveDropdowns();
    const dropdowns: Dropdown[] = [];

    for (const dropdown of dropdownsData) {
      const activesValue: string[] = [];
      for (const index of dropdown.activesIndex) {
        activesValue.push(dropdown.itemsValue.at(index) || '');
      }

      const menu = dropdown.element.dropdownMenu;
      const { itemsValue, translation } = dropdown;

      dropdowns.push({
        element: dropdown.element.native,
        itemsValue,
        activesValue,
        labelMinimumSelection: menu.minNumberElementsSelection > 0,
        selection: dropdown.element.selection,
        translation,
      });
    }

    return dropdowns;
  }
}
