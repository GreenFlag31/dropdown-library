import { ElementRef, Injectable, QueryList } from '@angular/core';
import { DropdownsData, Select, TranslatedValues } from './interface';
import { DropdownItemDirective } from './dropdown-item.directive';

@Injectable({
  providedIn: 'root',
})
export class DropdownService {
  dropdownID = 0;
  private dropdownsData: DropdownsData[] = [];

  constructor() {}

  initialise(translatedValues: TranslatedValues[]) {
    this.populateDropdownsData(translatedValues);

    for (const dropdown of this.dropdownsData) {
      this.initialiseLabelsAndContent(dropdown);
    }
  }

  update(translatedValues: TranslatedValues[]) {
    this.populateDropdownsData(translatedValues);

    for (const dropdown of this.dropdownsData) {
      this.updateLabelsAndContent(dropdown);
    }
  }

  getListOfElements(dropdown: ElementRef) {
    const currentIndex = this.findCurrentIndexDropdown(dropdown.nativeElement);
    const items: string[] = [];

    if (currentIndex !== -1) {
      const children = this.dropdownsData[currentIndex].element.dropdownItems;

      for (const child of children) {
        items.push(child.native.innerText);
      }
    }

    return items;
  }

  private findCurrentIndexDropdown(element: HTMLElement) {
    return this.dropdownsData.findIndex(
      (dropdown) => dropdown.element.reference.nativeElement === element
    );
  }

  private populateDropdownsData(translatedValues: TranslatedValues[]) {
    for (const translation of translatedValues) {
      const currentIndex = this.findCurrentIndexDropdown(
        translation.dropdown.nativeElement
      );

      if (currentIndex !== -1) {
        this.dropdownsData[currentIndex] = {
          ...this.dropdownsData[currentIndex],
          title: translation.title,
          itemsValue: translation.items,
          ...(translation.labelUnselectOption
            ? { labelUnselectOption: translation.labelUnselectOption }
            : {}),
        };
      }
    }
  }

  private initialiseLabelsAndContent(dropdownContent: DropdownsData) {
    const arrayItems = dropdownContent.element.dropdownItems.toArray();
    const dropdown = dropdownContent.element;

    // update title and list
    dropdown.setDefaultsActiveItems();

    // update content
    for (let i = 0; i < dropdownContent.itemsValue.length; i++) {
      const element = dropdownContent.itemsValue[i];
      arrayItems[i].updateValueTranslation(element);
    }

    // update unselect
    dropdown.dropdownMenu.unselectText =
      dropdownContent.labelUnselectOption || '';
    dropdown.updateTitleDisplay(false);
  }

  private updateLabelsAndContent(dropdownContent: DropdownsData) {
    const arrayItems = dropdownContent.element.dropdownItems.toArray();
    const dropdown = dropdownContent.element;
    dropdown.clearListOfElements();

    for (let i = 0; i < dropdownContent.itemsValue.length; i++) {
      // update content
      const element = dropdownContent.itemsValue[i];
      arrayItems[i].updateValueTranslation(element);

      // update labels (not at initialisation)
      const activeIndex = dropdownContent.activesIndex.indexOf(i);
      if (activeIndex !== -1) {
        dropdown.updateTitleAndList(element);
      }
    }

    // update title
    dropdown.updateTitleValue(dropdownContent.title);
    // update unselect
    dropdown.dropdownMenu.unselectText =
      dropdownContent.labelUnselectOption || '';
    dropdown.updateTitleDisplay(false);
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

  clearActiveIndexCurrentDropdown(id: number) {
    this.getDropdown(id).activesIndex = [];
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
