import {
  Directive,
  AfterViewInit,
  Input,
  ElementRef,
  HostListener,
  HostBinding,
  AfterContentInit,
} from '@angular/core';
import { DropdownDirective } from './dropdown.directive';
import { DropdownMenuDirective } from './dropdown-menu.directive';
import { StyleSelection } from './interface';

@Directive({
  selector: '[ngxDropdownItem]',
  standalone: true,
  host: { class: 'ngx-dropdown-item' },
})
export class DropdownItemDirective implements AfterContentInit, AfterViewInit {
  @Input() disable = false;

  private value = '';
  private iconSelection: 'check' | StyleSelection = 'check';
  private iconColor = 'green';

  constructor(
    private element: ElementRef<HTMLElement>,
    private dropdown: DropdownDirective,
    private dropdownMenu: DropdownMenuDirective
  ) {}

  get native() {
    return this.element.nativeElement;
  }

  ngAfterContentInit() {
    this.iconSelection = this.dropdownMenu.iconSelection;
    this.iconColor = this.dropdownMenu.iconC;
  }

  ngAfterViewInit() {
    this.value = this.native.innerText;
    this.addTabIndex();
  }

  private addTabIndex() {
    this.element.nativeElement.tabIndex = 0;
  }

  get height() {
    return this.native.clientHeight;
  }

  /**
   * Updates the text element
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
      this.element.nativeElement.classList.add('ngx-custom');
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
      class="ngx-checked"
      aria-label="check mark icon"
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

    const svgPathElement =
      this.element.nativeElement.querySelector<SVGElement>(
        '.ngx-checked path'
      )!;

    svgPathElement.style.stroke = this.iconColor;
    if (this.dropdown.selection === 'single') {
      svgPathElement.style.animation = '';
    } else {
      svgPathElement.style.animation =
        'dash 0.2s cubic-bezier(0, 0, 0.2, 1) forwards';
    }
  }

  private resetStyle(element: HTMLElement | null) {
    if (!element) return;

    element.style.backgroundColor =
      this.element.nativeElement.style.backgroundColor;
    element.style.color = this.element.nativeElement.style.color;
    element.style.borderLeft = this.element.nativeElement.style.borderLeft;
    element.style.fontWeight = this.element.nativeElement.style.fontWeight;

    element.classList.remove('ngx-custom');
  }

  @HostListener('keydown.enter', ['$event'])
  onEnter() {
    debugger;
  }

  @HostListener('click', ['$event'])
  onClick(e: Event) {
    e.stopPropagation();
    if (this.disable) return;

    const checkIcon =
      this.element.nativeElement.querySelector<HTMLElement>('.ngx-checked');
    const customStyleCheckedEl =
      this.element.nativeElement.querySelector<HTMLElement>('.ngx-custom');

    const selection = this.element.nativeElement.innerText || '';
    this.dropdown.selectionChange.next(selection);

    if (
      this.element.nativeElement.contains(checkIcon) ||
      this.element.nativeElement.contains(customStyleCheckedEl)
    ) {
      this.unselectStyles(checkIcon, customStyleCheckedEl);
    } else {
      if (this.dropdown.selection === 'single') {
        this.unselectStyles(checkIcon, customStyleCheckedEl);
        this.dropdown.visibilityChange.next(false);
      }
      this.onItemSelection();
    }
  }

  unselectStyles(
    checkIcon: HTMLElement | null,
    customStyleCheckedEl: HTMLElement | null
  ) {
    checkIcon?.remove();
    this.resetStyle(customStyleCheckedEl);
  }

  set activation(value: boolean) {
    this.active = value;
  }

  active = false;
  @HostBinding('class.active')
  get activate() {
    return this.active;
  }
  @HostBinding('class.ngx-disabled-item')
  get disabled() {
    return this.disable;
  }
}
