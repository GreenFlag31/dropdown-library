import { Injectable, QueryList } from '@angular/core';
import { DropdownsData, Select, TranslatedValues } from './interface';
import { DropdownItemDirective } from './dropdown-item.directive';

@Injectable({
  providedIn: 'root',
})
export class DropdownService {
  dropdownID = 0;
  private dropdownsData: DropdownsData[] = [];

  constructor() {}

  update(translatedValues: TranslatedValues[]) {
    this.translation(translatedValues);
  }

  translation(translatedValues: TranslatedValues[]) {
    // modifier dropdownsAndNativeContent pour mettre les traductions à jour
    for (const translation of translatedValues) {
      let currentIndex = this.dropdownsData.findIndex(
        (dropdown) =>
          dropdown.element.reference.nativeElement ===
          translation.dropdown.nativeElement
      );

      if (currentIndex !== -1) {
        this.dropdownsData[currentIndex] = {
          ...this.dropdownsData[currentIndex],
          title: translation.title,
          itemsValue: translation.items,
        };
      }
    }

    // debugger;

    // mettre à jour les indices actifs avec leurs valeurs: content, labels, title
    for (const dropdown of this.dropdownsData) {
      this.changeLabelsAndContent(dropdown);
    }
  }

  private changeLabelsAndContent(dropdownContent: DropdownsData) {
    const arrayItems = dropdownContent.element.dropdownItems.toArray();
    const dropdown = dropdownContent.element;

    for (let i = 0; i < dropdownContent.itemsValue.length; i++) {
      // update content
      const element = dropdownContent.itemsValue[i];
      arrayItems[i].updateValueTranslation(element);

      // update labels
      const activeIndex = dropdownContent.activesIndex.indexOf(i);
      if (activeIndex !== -1) {
        dropdown.updateDropdownTitle(element);
      }
    }

    // update title
    dropdown.updateTitleValue(dropdownContent.title);
    dropdown.displayTitleOnTop(false);

    if (!dropdownContent.updated) {
      dropdown.setDefaultsActiveItems();
      dropdownContent.updated = true;
    }
  }

  addActiveDropdownsAndContent(active: DropdownsData) {
    this.dropdownsData.push(active);
  }

  updateActivesIndex(dropdownID: number, index: number, selection: Select) {
    if (this.dropdownsData.length === 0 || index === -1) {
      return;
    }

    // debugger;

    let activeIndexes = this.getDropdown(dropdownID);

    if (selection === 'multiple') {
      if (!activeIndexes.activesIndex.includes(index)) {
        activeIndexes.activesIndex.push(index);
      } else {
        activeIndexes.activesIndex.splice(
          activeIndexes.activesIndex.indexOf(index),
          1
        );
      }
    } else {
      activeIndexes.activesIndex = [index];
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
