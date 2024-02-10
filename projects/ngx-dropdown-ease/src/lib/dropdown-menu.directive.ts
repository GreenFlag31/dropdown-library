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

  /**
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

      this.heightOfContent = this.computeHeightContent();
      this.positionMenuCorrection();

      if (this.animation !== 'none') {
        this.element.nativeElement.style.animation = '';
        this.element.nativeElement.getBoundingClientRect();
        this.element.nativeElement.style.animation = this.animation;
      }
    });

    if (this.animation === 'expand') {
      this.element.nativeElement.style.transition = `${this.animationTimingMs}ms ${this.animationTimingFn}`;
    }
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

  ngAfterViewInit() {
    if (this.unselectOption) {
      this.addUnselectOption();
    }
  }

  private addUnselectOption() {
    this.element.nativeElement.insertAdjacentHTML(
      'afterbegin',
      '<div class="ngx-unselect ngx-dropdown-item"><p>Unselect</p></div>'
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

    this.unselect.addEventListener('click', this.onUnselectClick.bind(this));
  }

  private onUnselectClick(e: MouseEvent) {
    e.stopPropagation();

    const selected =
      this.element.nativeElement.querySelectorAll('.ngx-checked') ||
      this.element.nativeElement.querySelectorAll('.ngx-custom');
    if (selected.length === 0) return;

    selected.forEach((item) => item.remove());
    this.dropdown.dropdownTitle.native.textContent = '';
    this.dropdown.native.querySelector('.ngx-badge')?.remove();

    this.dropdown.clearListOfElements();
    this.dropdownService.clearActiveIndexCurrentDropdown(
      this.dropdown.dropdownID
    );
  }

  private firstElementHeight() {
    return this.dropdownItems.first.height;
  }

  private numberOfElements() {
    return this.dropdownItems.length;
  }

  private computeHeightContent() {
    const extraSpaceUnselect = this.unselectOption
      ? this.unselect.clientHeight
      : 0;

    if (this.elementsVisible < this.numberOfElements()) {
      this.native.style.overflow = 'auto';
      return (
        this.firstElementHeight() * this.elementsVisible + extraSpaceUnselect
      );
    }

    return (
      this.firstElementHeight() * this.numberOfElements() + extraSpaceUnselect
    );
  }

  @HostBinding('style.maxHeight')
  get opened() {
    return this.open ? this.heightOfContent + 'px' : 0;
  }
}
