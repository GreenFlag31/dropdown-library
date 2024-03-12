import {
  Directive,
  AfterViewInit,
  ElementRef,
  ContentChild,
  Input,
  OnInit,
} from '@angular/core';
import {
  DropdownDirective,
  DropdownTitleDirective,
} from './dropdown.directive';
import { InternalDropdownService } from './internalDropdown.service';

@Directive({
  selector: '[ngxDropdownTitleContainer]',
  standalone: true,
  host: { class: 'ngx-dropdown-title-container' },
})
export class DropdownTitleContainerDirective implements OnInit, AfterViewInit {
  @Input() badge = false;
  @Input() icon = true;
  @Input() iconColor = '#000';
  @Input() displaySecondaryTitle = true;
  @Input() mainTitleColor = '#000';
  @Input() secondarytitleColor = '#000';
  @Input() secondaryTitleAnimation = true;

  private elementsSelected = 0;
  private badgeElement!: HTMLSpanElement;
  private badgeAdded = false;
  private titlePlaceholder!: HTMLHeadElement;

  @ContentChild(DropdownTitleDirective)
  dropdownTitle!: DropdownTitleDirective;

  constructor(
    private element: ElementRef<HTMLDivElement>,
    private dropdown: DropdownDirective,
    private dropdownService: InternalDropdownService
  ) {}

  get native() {
    return this.element.nativeElement;
  }

  get selectionNumber() {
    return this.numberOfActiveItems();
  }

  get isBadge() {
    return this.badge;
  }

  get badgeEl() {
    return this.badgeElement;
  }

  get badgeHasBeenAdded() {
    return this.badgeAdded;
  }

  get secondaryTitleC() {
    return this.secondarytitleColor;
  }

  get secondaryTitle() {
    return this.displaySecondaryTitle;
  }

  get animationSecondaryTitle() {
    return this.secondaryTitleAnimation;
  }

  get placeholder() {
    return this.titlePlaceholder;
  }

  set titleOnPlaceholder(value: string) {
    // might not be present at first template update
    if (!this.titlePlaceholder) return;
    this.titlePlaceholder.innerText = value;
  }

  ngOnInit() {
    this.badgeElement = document.createElement('span');
    this.badgeElement.classList.add('ngx-badge');
    this.native.style.color = this.mainTitleColor;
    this.dropdown.selectionChange.subscribe(() => this.handleBadge());
  }

  ngAfterViewInit() {
    this.addIcon();
    this.addTitlePlaceholder();
  }

  /**
   * Add a title placeholder to not lose eventual translate pipes in the template and hide the dropdownTitle.
   */
  addTitlePlaceholder() {
    if (this.dropdown.searchbar) return;

    this.titlePlaceholder = document.createElement('h4');
    const nativeTitle = this.dropdownTitle.native;
    this.titlePlaceholder.innerText = nativeTitle.innerText;
    this.titlePlaceholder.style.minHeight = nativeTitle.clientHeight + 'px';
    nativeTitle.classList.forEach((cl) => {
      this.titlePlaceholder.classList.add(cl);
    });

    nativeTitle.style.display = 'none';
    this.native.prepend(this.titlePlaceholder);
  }

  /**
   * Add min height to not introduce a height change on the dropdown.
   * Custom fond might be used, so update min height not at start.
   * titlePlaceholder is not present in case of searchbar.
   */
  addMinHeightOnTitlePlaceholder() {
    if (!this.titlePlaceholder) return;

    this.titlePlaceholder.style.minHeight =
      this.titlePlaceholder.clientHeight + 'px';
  }

  handleBadge() {
    // no badge with searchbar
    if (!this.badge || this.dropdown.searchbar) return;

    this.elementsSelected = this.numberOfActiveItems();

    if (this.elementsSelected > 1) {
      this.badgeElement.innerText = this.elementsSelected.toString();
      if (!this.badgeAdded) {
        this.dropdownTitle.native.after(this.badgeElement);
        this.badgeAdded = true;
      }
    } else {
      this.badgeElement.remove();
      this.badgeAdded = false;
    }
  }

  addIcon() {
    if (!this.icon) return;

    this.native.insertAdjacentHTML(
      'beforeend',
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" class="ngx-dropdown-icon" aria-label="dropdown mark icon">
      <path
        d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z"
      />
      </svg>`
    );

    this.native.querySelector<SVGElement>('.ngx-dropdown-icon')!.style.fill =
      this.iconColor;
  }

  numberOfActiveItems() {
    const dropdown = this.dropdownService.getDropdown(this.dropdown.dropdownID);

    return dropdown.activesIndex.length;
  }
}
