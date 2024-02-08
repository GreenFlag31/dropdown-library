import {
  Directive,
  AfterViewInit,
  Input,
  ElementRef,
  HostListener,
} from '@angular/core';
import { DropdownDirective } from './dropdown.directive';
import { DropdownMenuDirective } from './dropdown-menu.directive';
import { StyleSelection } from './interface';

@Directive({
  selector: '[ngxDropdownItem]',
  standalone: true,
  host: { class: 'dropdown-item' },
})
export class DropdownItemDirective implements AfterViewInit {
  @Input() iconSelection: 'check' | StyleSelection = 'check';

  value = '';

  constructor(
    private element: ElementRef<HTMLElement>,
    private dropdown: DropdownDirective,
    private dropdownMenu: DropdownMenuDirective
  ) {}

  get native() {
    return this.element.nativeElement;
  }

  ngAfterViewInit() {
    this.value = this.element.nativeElement.innerText;
  }

  get height() {
    return this.element.nativeElement.clientHeight;
  }

  /**
   * Only updates the text element, assigning its innerText will remove non text element
   */
  updateValueTranslation(value: string) {
    const itemContent = Array.from(this.native.childNodes);

    for (const content of itemContent) {
      if (content.textContent?.trim()) {
        content.textContent = value;
      }
    }
  }

  onItemSelection() {
    if (this.isOfTypeSelectItem(this.iconSelection)) {
      this.element.nativeElement.style.backgroundColor =
        this.iconSelection['backgroundColor'] || '';
      this.element.nativeElement.style.color =
        this.iconSelection['color'] || '';
      this.element.nativeElement.style.borderLeft =
        this.iconSelection['borderLeft'] || '';
      this.element.nativeElement.style.fontWeight =
        this.iconSelection['fontWeight'] || '';
      this.element.nativeElement.classList.add('custom');
      return;
    }

    this.insertCheckedSvg();
  }

  private isOfTypeSelectItem(
    selection: 'check' | StyleSelection
  ): selection is StyleSelection {
    return typeof selection === 'object';
  }

  private insertCheckedSvg() {
    this.element.nativeElement.insertAdjacentHTML(
      'beforeend',
      `<svg
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      viewBox="118.5 173.4 210.8 148.7"
      class="checked"
    >
      <path
        d="M118.536242,243.636061l74.008167,78.570055c20.209302-20.237147,88.643529-95.765658,136.868454-148.723912"
        fill="none"
        stroke-width="35"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>`
    );
  }

  private resetStyle(element: HTMLElement | null) {
    if (!element) return;

    element.style.backgroundColor =
      this.element.nativeElement.style.backgroundColor;
    element.style.color = this.element.nativeElement.style.color;
    element.style.borderLeft = this.element.nativeElement.style.borderLeft;
    element.style.fontWeight = this.element.nativeElement.style.fontWeight;

    element.classList.toggle('custom');
  }

  @HostListener('click', ['$event'])
  onClick(e: Event) {
    e.stopPropagation();
    let checkIcon =
      this.dropdownMenu.native.querySelector<HTMLElement>('.checked');
    let customStyleCheckedEl =
      this.dropdownMenu.native.querySelector<HTMLElement>('.custom');

    const currentSelection = this.element.nativeElement.innerText || '';

    if (this.dropdown.selection === 'single') {
      checkIcon?.remove();
      this.resetStyle(customStyleCheckedEl);
      this.onItemSelection();
      this.dropdown.selectionChange.next(currentSelection);
      this.dropdown.visibilityChange.next(false);
      return;
    }

    // multiple selection
    checkIcon = this.element.nativeElement.querySelector('.checked');
    customStyleCheckedEl = this.element.nativeElement.querySelector('.custom');

    if (
      this.element.nativeElement.contains(checkIcon) ||
      this.element.nativeElement.contains(customStyleCheckedEl)
    ) {
      checkIcon?.remove();
      this.resetStyle(customStyleCheckedEl);
    } else {
      this.onItemSelection();
    }

    this.dropdown.selectionChange.next(currentSelection);
  }
}
