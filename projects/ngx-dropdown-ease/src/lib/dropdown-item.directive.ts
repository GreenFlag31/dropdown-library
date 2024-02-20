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
import { InternalDropdownService } from './internalDropdown.service';

@Directive({
  selector: '[ngxDropdownItem]',
  standalone: true,
  host: { class: 'ngx-dropdown-item' },
})
export class DropdownItemDirective implements AfterContentInit, AfterViewInit {
  @Input() disable = false;

  private iconSelection: 'check' | StyleSelection = 'check';
  private iconColor = 'green';
  private active = false;
  private originalBC = '';
  private originalC = '';
  private originalBL = '';
  private originalFW = '';

  constructor(
    private element: ElementRef<HTMLElement>,
    private dropdown: DropdownDirective,
    private dropdownMenu: DropdownMenuDirective,
    private dropdownService: InternalDropdownService
  ) {}

  get native() {
    return this.element.nativeElement;
  }

  ngAfterContentInit() {
    this.iconSelection = this.dropdownMenu.iconSelection;
    this.iconColor = this.dropdownMenu.iconC;
  }

  ngAfterViewInit() {
    if (this.disable) {
      // accessibility
      this.native.setAttribute('disabled', 'disabled');
    }

    this.originalBC = this.native.style.backgroundColor;
    this.originalC = this.native.style.color;
    this.originalBL = this.native.style.borderLeft;
    this.originalFW = this.native.style.fontWeight;
    this.wrapTextContent();
  }

  private wrapTextContent() {
    const itemContent = Array.from(this.native.childNodes);

    for (const content of itemContent) {
      const text = content.textContent?.trim();
      if (text) {
        const p = document.createElement('p');
        p.classList.add('ngx-text');
        p.innerText = text;
        p.title = text;
        content.replaceWith(p);
      }
    }
  }

  get height() {
    return this.native.clientHeight;
  }

  set activation(value: boolean) {
    this.active = value;
  }

  /**
   * Updates the text element (translation)
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
      this.native.style.backgroundColor =
        this.iconSelection['backgroundColor'] || '';
      this.native.style.color = this.iconSelection['color'] || '';
      this.native.style.borderLeft = this.iconSelection['borderLeft'] || '';
      this.native.style.fontWeight = this.iconSelection['fontWeight'] || '';
      this.native.classList.add('ngx-custom');
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
    this.native.insertAdjacentHTML(
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
      this.native.querySelector<SVGElement>('.ngx-checked path')!;

    const keyframes = [{ strokeDashoffset: 315 }, { strokeDashoffset: 0 }];

    const options: KeyframeAnimationOptions = {
      duration: this.dropdown.selection === 'single' ? 0 : 200,
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
      fill: 'forwards',
    };

    svgPathElement.style.stroke = this.iconColor;
    svgPathElement.animate(keyframes, options);
  }

  private resetStyle(element: HTMLElement | null) {
    if (!element) return;

    element.style.backgroundColor = this.originalBC;
    element.style.color = this.originalC;
    element.style.borderLeft = this.originalBL;
    element.style.fontWeight = this.originalFW;

    element.classList.remove('ngx-custom');
  }

  @HostListener('click', ['$event'])
  onClick(e: Event) {
    e.stopPropagation();
    if (this.disable) return;

    const checkIcon = this.native.querySelector<HTMLElement>('.ngx-checked');
    const customStyleCheckedEl = this.native.classList.contains('ngx-custom');

    const selection = this.native.innerText || '';
    this.dropdown.selectionChange.next(selection);
    this.dropdown.lastSelectionOnClick = true;

    if (checkIcon || customStyleCheckedEl) {
      this.removeSelectionStyle(checkIcon, this.native);
    } else {
      this.singleSelection();
      this.onItemSelection();
    }
  }

  private singleSelection() {
    if (this.dropdown.selection === 'single') {
      const checkIcon =
        this.dropdownMenu.native.querySelector<HTMLElement>('.ngx-checked');
      const customStyleCheckedEl =
        this.dropdownMenu.native.querySelector<HTMLElement>('.ngx-custom');
      this.removeSelectionStyle(checkIcon, customStyleCheckedEl);
      this.dropdown.visibilityChange.next(false);
    }
  }

  private removeSelectionStyle(
    checkIcon: HTMLElement | null,
    customStyleCheckedEl: HTMLElement | null
  ) {
    checkIcon?.remove();
    this.resetStyle(customStyleCheckedEl);
  }

  @HostBinding('class.active')
  get activate() {
    return this.active;
  }

  @HostBinding('class.ngx-disabled-item')
  get disabled() {
    return this.disable;
  }
}
