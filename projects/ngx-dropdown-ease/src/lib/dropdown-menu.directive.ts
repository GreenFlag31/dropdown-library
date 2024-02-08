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
  host: { class: 'dropdown-menu' },
})
export class DropdownMenuDirective implements OnInit, AfterViewInit {
  @Input() position: Position = 'bottom';
  @Input() elementsVisible = Infinity;
  @Input() animation = 'expand';
  @Input() animationTimingMs = 300;
  @Input() animationTimingFn: AnimationTimingFn = 'ease';
  @Input() unselectOption = false;
  @Input() unselectOptionStyle!: StyleSelection;
  private heightOfContent = 0;
  private open = false;
  private originalAnimation!: Animation;

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

  ngOnInit() {
    this.originalAnimation = this.animation;

    this.dropdown.visibilityChange.subscribe((visible) => {
      this.open = visible;

      if (!visible) return;

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
    // CORRECTION
    const { bottom } = this.element.nativeElement.getBoundingClientRect();

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
    } else if (bottom - this.heightOfContent < 0 && this.position === 'top') {
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
      '<div class="unselect"><p>Unselect</p></div>'
    );
    const unselect =
      this.element.nativeElement.querySelector<HTMLDivElement>('.unselect')!;

    unselect.style.color = this.unselectOptionStyle['color'] || '';
    unselect.style.backgroundColor =
      this.unselectOptionStyle['backgroundColor'] || '';
    unselect.style.borderLeft = this.unselectOptionStyle['borderLeft'] || '';
    unselect.style.fontWeight = this.unselectOptionStyle['fontWeight'] || '';

    unselect.addEventListener('click', this.onUnselectClick);
  }

  private onUnselectClick(e: MouseEvent) {
    e.stopPropagation();
    const selected =
      this.element.nativeElement.querySelectorAll('.checked') ||
      this.element.nativeElement.querySelectorAll('.custom');
    if (selected.length === 0) return;

    selected.forEach((item) => item.remove());
    this.dropdown.dropdownTitle.native.textContent =
      this.dropdown.default_title;
    this.dropdown.native.querySelector('.badge')?.remove();

    this.dropdown.clearListOfElements();
    this.dropdownService.removeDropdownFromList(this.dropdown.dropdownID);
  }

  private firstElementHeight() {
    return this.dropdownItems.first.height;
  }

  private numberOfElements() {
    return this.dropdownItems.length;
  }

  private computeHeightContent() {
    if (this.elementsVisible < this.numberOfElements()) {
      this.native.style.overflow = 'auto';
      return this.firstElementHeight() * this.elementsVisible;
    }

    return this.firstElementHeight() * this.numberOfElements();
  }

  @HostBinding('style.maxHeight')
  get opened() {
    return this.open ? this.heightOfContent + 'px' : 0;
  }
}
