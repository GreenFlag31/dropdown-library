import { Injectable, QueryList } from '@angular/core';
import { DropdownsData, Select } from './interface';
import { DropdownItemDirective } from './dropdown-item.directive';
import { DropdownDirective } from './dropdown.directive';

@Injectable({
  providedIn: 'root',
})
export class InternalDropdownService {
  dropdownID = 0;
  private dropdownsData: DropdownsData[] = [];

  translateItems(dropdown: DropdownDirective, text: string, itemID: number) {
    if (!text) return;

    const currentIndex = this.findCurrentDropdownIndex(dropdown.dropdownID);

    if (currentIndex !== -1) {
      const currentDropdown = this.dropdownsData[currentIndex];
      this.updateItems(currentDropdown, text, itemID);
      currentDropdown.translation = true;
    }
  }

  private updateItems(dropdown: DropdownsData, text: string, itemID: number) {
    const currentDropdown = dropdown.element;
    const activesIndex = dropdown.activesIndex;
    const currentIndex = activesIndex.indexOf(itemID);

    if (currentIndex !== -1) {
      currentDropdown.updateTranslationContentInPlace(currentIndex, text);
    }
  }

  translateTitle(dropdown: DropdownDirective, text: string) {
    if (!text) return;

    const currentIndex = this.findCurrentDropdownIndex(dropdown.dropdownID);
    const currentDropdown = this.dropdownsData[currentIndex];

    if (currentIndex !== -1) {
      dropdown.updateTitleValue(text);
      currentDropdown.title = text;
      dropdown.updateSearchbarValue();
    }
  }

  addActiveDropdownsAndContent(active: DropdownsData) {
    this.dropdownsData.push(active);
  }

  updateActivesIndex(dropdownID: number, index: number, selection: Select) {
    if (this.dropdownsData.length === 0 || index === -1) {
      return;
    }

    let activeIndexes = this.getDropdown(dropdownID);

    if (selection === 'multiple') {
      if (activeIndexes.activesIndex.includes(index)) {
        activeIndexes.activesIndex.splice(
          activeIndexes.activesIndex.indexOf(index),
          1
        );
      } else {
        activeIndexes.activesIndex.push(index);
      }
    } else {
      if (activeIndexes.activesIndex.includes(index)) {
        activeIndexes.activesIndex = [];
      } else {
        activeIndexes.activesIndex = [index];
      }
    }
  }

  private findCurrentDropdownIndex(id: number) {
    return this.dropdownsData.findIndex(
      (dropdown) => dropdown.dropdownID === id
    );
  }

  getDropdown(dropdownIndex: number) {
    return this.dropdownsData[this.findCurrentDropdownIndex(dropdownIndex)];
  }

  findIndexOfCurrentSelection(
    dropdownItems: QueryList<DropdownItemDirective>,
    selection: string
  ) {
    const arrayOfItems = dropdownItems.toArray();
    return arrayOfItems.findIndex(
      (item) => item.native.innerText === selection
    );
  }

  getActiveDropdowns() {
    return this.dropdownsData;
  }

  removeDropdownFromList(id: number) {
    const indexToRemove = this.findCurrentDropdownIndex(id);

    if (indexToRemove !== -1) {
      this.dropdownsData.splice(indexToRemove, 1);
    }
  }
}
