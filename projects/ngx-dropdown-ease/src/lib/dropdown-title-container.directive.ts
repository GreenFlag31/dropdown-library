import {
  Directive,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ContentChild,
  Input,
  OnInit,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
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
export class DropdownTitleContainerDirective
  implements OnInit, AfterViewInit, OnDestroy
{
  @Input() badge = false;
  @Input() icon = true;
  @Input() iconColor = '#000';
  @Input() secondaryTitle = true;
  @Input() mainTitleColor = '#000';
  @Input() secondarytitleColor = '#000';
  @Input() secondaryTitleAnimation = true;

  private elementsSelected = 0;
  private destroy = new Subject<void>();
  private span!: HTMLSpanElement;
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
    return this.numberOfItems();
  }

  get isBadge() {
    return this.badge;
  }

  get displayTitleOption() {
    return this.secondaryTitle;
  }

  get animationSecondaryTitle() {
    return this.secondaryTitleAnimation;
  }

  ngOnInit() {
    this.span = document.createElement('span');
    this.span.classList.add('ngx-badge');
    this.dropdown.setTitleColor(this.mainTitleColor, this.secondarytitleColor);
    this.native.style.color = this.mainTitleColor;
  }

  ngAfterViewInit() {
    this.dropdown.default_title = this.dropdownTitle.native.innerText;

    this.addIcon();

    this.dropdown.selectionChange
      .pipe(takeUntil(this.destroy))
      .subscribe(() => {
        this.handleBadge();
      });
  }

  handleBadge() {
    this.elementsSelected = this.numberOfItems();

    // pas de badge avec searchbar?
    if (!this.badge || this.dropdown.searchbar) return;

    if (this.elementsSelected > 1) {
      this.span.textContent = this.elementsSelected.toString();
      if (!this.element.nativeElement.querySelector('.badge')) {
        this.dropdownTitle.native!.after(this.span);
      }
    } else {
      this.element.nativeElement.querySelector('.ngx-badge')?.remove();
    }
  }

  addIcon() {
    if (!this.icon) return;

    this.element.nativeElement.insertAdjacentHTML(
      'beforeend',
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" class="ngx-dropdown-icon" aria-label="dropdown mark icon">
      <path
        d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z"
      />
      </svg>`
    );

    this.element.nativeElement.querySelector<SVGElement>(
      '.ngx-dropdown-icon'
    )!.style.fill = this.iconColor;
  }

  numberOfItems() {
    const dropdown = this.dropdownService.getDropdown(this.dropdown.dropdownID);

    return dropdown.activesIndex.length || 0;
  }

  ngOnDestroy() {
    this.destroy.next();
  }
}
