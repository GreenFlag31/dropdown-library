import {
  Directive,
  OnInit,
  AfterViewInit,
  Input,
  ContentChildren,
  QueryList,
  ElementRef,
  HostBinding,
  HostListener,
} from '@angular/core';
import { DropdownItemDirective } from './dropdown-item.directive';
import { DropdownDirective } from './dropdown.directive';
import {
  Animation,
  AnimationTimingFn,
  Position,
  StyleSelection,
} from './interface';

@Directive({
  selector: '[ngxDropdownMenu]',
  standalone: true,
  host: { class: 'ngx-dropdown-menu' },
})
export class DropdownMenuDirective implements OnInit, AfterViewInit {
  @Input() position: Position = 'bottom';
  @Input() defaultActiveItems: number[] = [];
  @Input() elementsVisible = Infinity;
  @Input() animation = 'none';
  @Input() animationTimingMs = 300;
  @Input() animationTimingFn: AnimationTimingFn = 'ease';
  @Input() minNumberElementsToSelect = 0;
  @Input() iconSelection: 'check' | StyleSelection = 'check';
  @Input() iconColor = 'green';

  private heightOfContent = 0;
  private open = false;
  private originalAnimation!: Animation;

  @ContentChildren(DropdownItemDirective)
  private dropdownItems!: QueryList<DropdownItemDirective>;

  constructor(
    private element: ElementRef<HTMLDivElement>,
    private dropdown: DropdownDirective
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

  get minNumberElementsSelection() {
    return this.minNumberElementsToSelect;
  }

  get defaultActive() {
    return this.defaultActiveItems;
  }

  /**
   * In case of minimum selection
   * Validate dropdown on basis of a minimum number of elements to select.
   */
  private validateDropdown() {
    const selectionTotal = this.dropdown.currentNumberOfItemsSelected;

    if (!this.minNumberElementsToSelect) return;

    const isInvalid = selectionTotal < this.minNumberElementsToSelect;
    this.dropdown.setInvalidDropdown(isInvalid);
  }

  @HostListener('mouseenter')
  onEnter() {
    this.dropdown.removeClassActiveItems();
  }

  ngOnInit() {
    this.originalAnimation = this.animation;

    this.dropdown.visibilityChange.subscribe((visible) => {
      this.open = visible;

      if (!visible) {
        this.validateDropdown();
        return;
      }

      this.computeOnceHeightOfContent();
      this.positionMenuCorrection();

      if (this.animation !== 'none' && this.animation !== 'expand') {
        this.native.style.animation = '';
        // reflow
        this.native.getBoundingClientRect();
        this.native.style.animation = this.animation;
      }
    });
  }

  ngAfterViewInit() {
    if (this.animation === 'expand') {
      this.native.style.transition = `${this.animationTimingMs}ms ${this.animationTimingFn}`;
    }
  }

  private computeOnceHeightOfContent() {
    this.heightOfContent = this.heightOfContent || this.computeHeightContent();
  }

  private positionMenuCorrection() {
    const { bottom, top } = this.dropdown.native.getBoundingClientRect();

    this.native.classList.remove('top');
    this.native.classList.remove('bottom');
    this.native.classList.add(this.position);
    this.animation = this.originalAnimation;

    if (
      bottom + this.heightOfContent > window.innerHeight &&
      this.position === 'bottom'
    ) {
      this.native.classList.remove(this.position);
      this.native.classList.add('top');
      this.animation = this.animation.replace('going-up', 'going-down');
      this.animation = this.animation.replace(
        'scale-up-top',
        'scale-up-bottom'
      );
    } else if (top - this.heightOfContent < 0 && this.position === 'top') {
      this.native.classList.remove(this.position);
      this.native.classList.add('bottom');
      this.animation = this.animation.replace('going-down', 'going-up');
      this.animation = this.animation.replace(
        'scale-up-bottom',
        'scale-up-top'
      );
    }
  }

  private numberOfElements() {
    return this.dropdownItems.length;
  }

  computeTotalHeight(take: number, elements = this.dropdownItems.toArray()) {
    const items = elements.slice(0, take);

    return items.reduce((acc, current) => {
      return acc + current.native.clientHeight;
    }, 0);
  }

  computeHeightContent() {
    const items = this.numberOfElements();
    if (this.elementsVisible < items) {
      this.native.style.overflow = 'auto';
    }

    const take = Math.min(items, this.elementsVisible);
    return this.computeTotalHeight(take);
  }

  @HostBinding('style.maxHeight')
  get opened() {
    return this.open ? this.heightOfContent + 'px' : 0;
  }
}
