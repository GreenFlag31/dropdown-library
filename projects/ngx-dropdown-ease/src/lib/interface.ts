import { ElementRef } from '@angular/core';
import { DropdownDirective } from './dropdown.directive';

export interface StyleSelection {
  backgroundColor?: string;
  color?: string;
  borderLeft?: string;
  fontWeight?: string;
}

export type Position = 'top' | 'bottom';

export type AnimationTimingFn =
  | 'linear'
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | string;

export type Animation = 'expand' | 'none' | string;

export interface DropdownsData {
  dropdownID: number;
  element: DropdownDirective;
  title: string;
  activesIndex: number[];
  itemsValue: string[];
  translation: boolean;
}

export interface Dropdown {
  element: HTMLElement;
  itemsValue: string[];
  activesValue: string[];
  labelMinimumSelection: boolean;
  selection: 'single' | 'multiple';
  translation: boolean;
}

export type Select = 'single' | 'multiple';

export interface TranslatedValues {
  dropdown: ElementRef;
  title: string;
  items: string[];
}
