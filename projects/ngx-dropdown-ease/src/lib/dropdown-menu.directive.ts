import {
  Directive,
  OnInit,
  AfterViewInit,
  Input,
  ContentChildren,
  QueryList,
  ElementRef,
  HostBinding,
} from '@angular/core';
import { DropdownItemDirective } from './dropdown-item.directive';
import { DropdownDirective } from './dropdown.directive';
import {
  Animation,
  AnimationTimingFn,
  Position,
  StyleSelection,
} from './interface';
import { DropdownService } from './dropdown.service';

@Directive({
  selector: '[ngxDropdownMenu]',
  standalone: true,
  host: { class: 'ngx-dropdown-menu' },
})
export class DropdownMenuDirective implements OnInit, AfterViewInit {
  @Input() position: Position = 'bottom';
  @Input() defaultActiveItems: number[] = [];
  @Input() elementsVisible = Infinity;
  @Input() animation = 'expand';
  @Input() animationTimingMs = 300;
  @Input() animationTimingFn: AnimationTimingFn = 'ease';
  @Input() unselectOption = false;
  @Input() unselectOptionStyle!: StyleSelection | undefined;
  @Input() minNumberElementsToSelect = 0;
  @Input() iconSelection: 'check' | StyleSelection = 'check';
  @Input() iconColor = 'green';
  @Input() displayTitle = true;

  private heightOfContent = 0;
  private open = false;
  private originalAnimation!: Animation;
  private unselect!: HTMLDivElement;

  @ContentChildren(DropdownItemDirective)
  private dropdownItems!: QueryList<DropdownItemDirective>;

  constructor(
    private element: ElementRef<HTMLDivElement>,
    private dropdown: DropdownDirective,
    private dropdownService: DropdownService
  ) {}

  get native() {
    return this.element.nativeElement;
  }

  get icon() {
    return this.iconSelection;
  }

  get iconC() {
    return this.iconColor;
  }

  get displayTitleOption() {
    return this.displayTitle;
  }

  get unselectionOption() {
    return this.unselectOption;
  }

  get minNumberElementsSelection() {
    return this.minNumberElementsToSelect;
  }

  get defaultActive() {
    return this.defaultActiveItems;
  }

  set unselectText(value: string) {
    if (!this.unselectOption) return;
    this.unselect.innerText = value;
  }

  changeUnselectVisibility(visible: boolean) {
    if (this.unselect) {
      this.unselect.style.display = visible ? 'flex' : 'none';
    }
  }

  /**
   * In case of minimum selection
   * Validate dropdown on basis of a minimum number of elements to select.
   */
  private validateDropdown() {
    const currentNumberOfItemsSelected =
      this.dropdown.currentNumberOfItemsSelected;

    if (!this.minNumberElementsToSelect) return;

    if (currentNumberOfItemsSelected < this.minNumberElementsToSelect) {
      this.dropdown.setInvalidDropdown(true);
    } else {
      this.dropdown.setInvalidDropdown(false);
    }
  }

  ngOnInit() {
    this.originalAnimation = this.animation;

    this.dropdown.visibilityChange.subscribe((visible) => {
      this.open = visible;

      if (!visible) {
        this.validateDropdown();
        return;
      }

      this.refreshHeightContent();
      this.positionMenuCorrection();

      if (this.animation !== 'none') {
        this.element.nativeElement.style.animation = '';
        // reflow
        this.element.nativeElement.getBoundingClientRect();
        this.element.nativeElement.style.animation = this.animation;
      }
    });

    if (this.animation === 'expand') {
      this.element.nativeElement.style.transition = `${this.animationTimingMs}ms ${this.animationTimingFn}`;
    }
  }

  ngAfterViewInit() {
    if (this.unselectOption) {
      this.addUnselectOption();
      this.dropdown.addUnselectToKeyboardSupport(this.unselect);
    }
  }

  refreshHeightContent() {
    this.heightOfContent = this.computeHeightContent();
  }

  positionMenuCorrection() {
    const { bottom, top } = this.dropdown.native.getBoundingClientRect();

    this.element.nativeElement.classList.remove('top');
    this.element.nativeElement.classList.remove('bottom');
    this.element.nativeElement.classList.add(this.position);
    this.animation = this.originalAnimation;

    if (
      bottom + this.heightOfContent > window.innerHeight &&
      this.position === 'bottom'
    ) {
      this.element.nativeElement.classList.remove(this.position);
      this.element.nativeElement.classList.add('top');
      this.animation = this.animation.replace('going-up', 'going-down');
    } else if (top - this.heightOfContent < 0 && this.position === 'top') {
      this.element.nativeElement.classList.remove(this.position);
      this.element.nativeElement.classList.add('bottom');
      this.animation = this.animation.replace('going-down', 'going-up');
    }
  }

  private addUnselectOption() {
    this.element.nativeElement.insertAdjacentHTML(
      'afterbegin',
      '<p class="ngx-unselect">Unselect</p>'
    );
    this.unselect =
      this.element.nativeElement.querySelector<HTMLDivElement>(
        '.ngx-unselect'
      )!;

    if (this.unselectOptionStyle) {
      this.unselect.style.color = this.unselectOptionStyle['color'] || '';
      this.unselect.style.backgroundColor =
        this.unselectOptionStyle['backgroundColor'] || '';
      this.unselect.style.borderLeft =
        this.unselectOptionStyle['borderLeft'] || '';
      this.unselect.style.fontWeight =
        this.unselectOptionStyle['fontWeight'] || '';
    }

    this.unselect.tabIndex = 0;

    this.unselect.addEventListener('click', this.onUnselectClick.bind(this));
    this.unselect.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        this.onUnselectClick(event);
      }
    });
  }

  private onUnselectClick(e: MouseEvent | KeyboardEvent) {
    e.stopPropagation();

    const selected =
      this.element.nativeElement.querySelectorAll('.ngx-checked') ||
      this.element.nativeElement.querySelectorAll('.ngx-custom');
    if (selected.length === 0) return;

    selected.forEach((item) => item.remove());
    this.dropdown.dropdownTitle.native.textContent = '';
    this.dropdown.native.querySelector('.ngx-badge')?.remove();

    this.dropdown.clearListOfElements();
    this.dropdown.resetToDefaultTitle();
    this.dropdownService.clearActiveIndexCurrentDropdown(
      this.dropdown.dropdownID
    );
  }

  private numberOfElements() {
    return this.dropdownItems.length;
  }

  private computeTotalHeight(
    occurence = this.numberOfElements(),
    elements = this.dropdownItems
  ) {
    const maximum = Math.min(occurence, this.elementsVisible);
    const items = elements.toArray().slice(0, maximum);

    return items.reduce((acc, current) => {
      return acc + current.native.clientHeight;
    }, 0);
  }

  private computeHeightContent() {
    if (this.heightOfContent) return this.heightOfContent;

    const extraSpaceUnselect = this.unselectOption
      ? this.unselect.clientHeight
      : 0;

    if (this.elementsVisible < this.numberOfElements()) {
      this.native.style.overflow = 'auto';
    }

    return this.computeTotalHeight() + extraSpaceUnselect;
  }

  @HostBinding('style.maxHeight')
  get opened() {
    return this.open ? this.heightOfContent + 'px' : 0;
  }
}
