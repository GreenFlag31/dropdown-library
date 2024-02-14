import { ElementRef } from '@angular/core';
import { DropdownDirective } from './dropdown.directive';

export interface StyleSelection {
  backgroundColor?: string;
  color?: string;
  borderLeft?: string;
  fontWeight?: string;
}

export type Position =
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'bottom-left'
  | 'bottom'
  | 'bottom-right';

export type AnimationTimingFn =
  | 'linear'
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out';

export type Animation = 'expand' | 'none' | string;

export interface DropdownsData {
  dropdownID: number;
  element: DropdownDirective;
  title: string;
  activesIndex: number[];
  itemsValue: string[];
  labelUnselectOption?: string;
}

export type Select = 'single' | 'multiple';

export interface TranslatedValues {
  dropdown: ElementRef;
  title: string;
  items: string[];
  labelUnselectOption?: string;
}
