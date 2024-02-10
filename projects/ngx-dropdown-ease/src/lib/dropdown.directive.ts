import {
  OnInit,
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  ContentChild,
  ContentChildren,
  QueryList,
  AfterContentInit,
  HostBinding,
} from '@angular/core';
import { Subject, filter, fromEvent, switchMap, take, takeUntil } from 'rxjs';
import { DropdownItemDirective } from './dropdown-item.directive';
import { DropdownsData, Select } from './interface';
import { DropdownService } from './dropdown.service';
import { DropdownTitleContainerDirective } from './dropdown-title-container.directive';
import { DropdownMenuDirective } from './dropdown-menu.directive';
import { NumberSymbol } from '@angular/common';

@Directive({
  selector: '[ngxDropdownTitle]',
  standalone: true,
  host: { class: 'ngx-dropdown-title' },
})
export class DropdownTitleDirective {
  constructor(private element: ElementRef<HTMLElement>) {}

  get native() {
    return this.element.nativeElement;
  }
}

@Directive({
  selector: '[ngxDropdown]',
  standalone: true,
  host: { class: 'ngx-dropdown' },
})
export class DropdownDirective implements OnInit, AfterContentInit, OnDestroy {
  @Input() selection: Select = 'single';
  @Input() defaultTitle = '';
  @Input() disable = false;

  visibilityChange = new Subject<boolean>();
  selectionChange = new Subject<string>();
  private defaultActiveItems: number[] = [];
  private listOfElements: string[] = [];
  private open = false;
  private mouseDown$ = fromEvent<MouseEvent>(document, 'mousedown');
  private mouseUp$ = fromEvent<MouseEvent>(document, 'mouseup');
  private elementAndContent = {} as DropdownsData;
  private ID = 0;
  private notifierEndSub = new Subject<void>();
  private destroy = new Subject<void>();
  private titleIsOnTop = false;
  private pTitleOnTop!: HTMLParagraphElement;
  private titleColor = '#000';
  private defaultColor = '#000';
  private invalid = false;
  private labelMinSelection!: HTMLParagraphElement;
  private keyboardIndex = -1;

  @ContentChild(DropdownTitleContainerDirective)
  dropdownTitleContainer!: DropdownTitleContainerDirective;
  @ContentChild(DropdownTitleDirective) dropdownTitle!: DropdownTitleDirective;
  @ContentChild(DropdownMenuDirective) dropdownMenu!: DropdownMenuDirective;
  @ContentChildren(DropdownItemDirective, { descendants: true })
  dropdownItems!: QueryList<DropdownItemDirective>;

  constructor(
    private element: ElementRef<HTMLElement>,
    private dropdownService: DropdownService
  ) {}

  get default_title() {
    return this.defaultTitle;
  }

  set default_title(value: string) {
    this.defaultTitle = value;
  }

  get native() {
    return this.element.nativeElement;
  }

  get reference() {
    return this.element;
  }

  get dropdownID() {
    return this.ID;
  }

  get currentNumberOfItemsSelected() {
    return this.dropdownTitleContainer.selectionNumber;
  }

  set titleValue(value: string) {
    this.defaultTitle = value;
  }

  setInvalidDropdown(invalid: boolean) {
    this.invalid = invalid;
    this.labelMinSelection.style.visibility = `${
      invalid ? 'visible' : 'hidden'
    }`;
  }

  getListOfElements() {
    return this.listOfElements;
  }

  clearListOfElements() {
    this.listOfElements = [];
  }

  ngOnInit() {
    this.onSelectionChange();
    this.onItemSelection();
    this.ID = this.dropdownService.dropdownID;
    this.dropdownService.dropdownID += 1;
  }

  arrayOfItems!: (DropdownItemDirective | undefined)[];
  ngAfterContentInit() {
    this.createLabelMinNumberSelection();
    this.populateDropdownsInTheService();
    this.addTabIndex();
    this.arrayOfItems = this.dropdownItems.toArray();
  }

  private addTabIndex() {
    this.element.nativeElement.tabIndex = 0;
  }

  private createLabelMinNumberSelection() {
    const minSelection = this.dropdownMenu.minNumberElementsSelection;

    if (minSelection === 0) return;

    this.element.nativeElement.classList.add('transparent-border');
    this.labelMinSelection = document.createElement('p');
    this.labelMinSelection.classList.add('ngx-label-min-selection');
    this.labelMinSelection.innerText = `Please select min ${minSelection} element${
      minSelection > 1 ? 's' : ''
    }`;
    this.element.nativeElement.prepend(this.labelMinSelection);
  }

  private populateDropdownsInTheService() {
    const itemsValue = [];
    for (const item of this.dropdownItems) {
      itemsValue.push(item.native.innerText);
    }

    this.defaultActiveItems = this.dropdownMenu.defaultActive;

    this.elementAndContent = {
      element: this,
      dropdownID: this.ID,
      activesIndex: this.defaultActiveItems,
      title: this.dropdownTitle.native.innerText,
      itemsValue,
    };
    this.dropdownService.addActiveDropdownsAndContent(this.elementAndContent);
  }

  /**
   * Update the default active elements.
   * Push in the list of active elements, add check mark or custom style.
   */
  setDefaultsActiveItems() {
    const arrayDropdownItems = this.dropdownItems.toArray();
    for (let i = 0; i < arrayDropdownItems.length; i++) {
      const current = arrayDropdownItems[i];

      if (this.defaultActiveItems.indexOf(i) === -1) continue;

      const content = current.native.innerText || '';
      // styling
      current.onItemSelection();
      this.updateDropdownTitle(content);
      this.dropdownTitleContainer.handleBadge();

      if (this.selection === 'single') break;
    }
  }

  setTitleColor(defaultColor: string, color: string) {
    this.defaultColor = defaultColor;
    this.titleColor = color;
  }

  private updateTitleInnerText(
    element: HTMLElement | undefined,
    title: string
  ) {
    if (!element || element.innerText === '') return;
    element.innerText = title;
  }

  /**
   * In case of translation and zero active items, update the title or the paragraph (the title on top).
   */
  displayTitleOnTop(animation = true) {
    if (this.listOfElements.length === 0) {
      this.updateTitleInnerText(this.dropdownTitle.native, this.defaultTitle);
    }
    this.updateTitleInnerText(this.pTitleOnTop, this.defaultTitle);

    if (
      this.dropdownService.getDropdown(this.ID).activesIndex.length === 0 &&
      !this.open
    ) {
      return;
    }

    if (!this.pTitleOnTop) {
      this.pTitleOnTop = document.createElement('p');
      this.pTitleOnTop.classList.add('ngx-dropdown-title-top');
      this.pTitleOnTop.style.color = this.titleColor;
      this.dropdownTitle.native.style.minHeight =
        this.dropdownTitle.native.clientHeight + 'px';
      this.dropdownTitle.native.innerText = '';
      this.element.nativeElement.prepend(this.pTitleOnTop);
    }

    this.pTitleOnTop.innerText = this.defaultTitle;
    this.pTitleOnTop.style.color = this.titleColor;
    this.titleIsOnTop = true;

    this.pTitleOnTop.style.animation = `to-right-title ${
      animation ? '0.3s' : ''
    } forwards`;
  }

  private onItemSelection() {
    this.visibilityChange.pipe(takeUntil(this.destroy)).subscribe((visible) => {
      this.open = visible;

      if (visible && !this.titleIsOnTop) {
        this.displayTitleOnTop();
      } else if (!visible && this.titleIsOnTop) {
        if (this.dropdownService.getDropdown(this.ID).activesIndex.length > 0) {
          return;
        }

        const title = this.element.nativeElement
          .firstChild as HTMLParagraphElement;
        title.style.animation = '';
        title.style.color = this.defaultColor;
        this.titleIsOnTop = false;
      }
    });
  }

  private onSelectionChange() {
    this.selectionChange
      .pipe(takeUntil(this.destroy))
      .subscribe((selection) => {
        this.updateDropdownTitle(selection);
        this.updateActiveIndexService(selection);
      });
  }

  private updateActiveIndexService(selection: string) {
    const currentIndex = this.dropdownService.findIndexOfCurrentSelection(
      this.dropdownItems,
      selection
    );
    this.dropdownService.updateActivesIndex(
      this.ID,
      currentIndex,
      this.selection
    );
  }

  updateDropdownTitle(selection: string) {
    const dropdownTitle = this.dropdownTitle.native;
    dropdownTitle.innerText = '';

    if (this.selection === 'multiple') {
      if (this.listOfElements.includes(selection)) {
        this.listOfElements.splice(this.listOfElements.indexOf(selection), 1);
      } else {
        this.listOfElements.push(selection);
      }
    } else {
      if (this.listOfElements.includes(selection)) {
        this.listOfElements = [];
      } else {
        this.listOfElements = [selection];
      }
    }

    dropdownTitle.innerText = this.listOfElements.reverse().join(', ');
    dropdownTitle.title = dropdownTitle.innerText;
  }

  @HostListener('click', ['$event'])
  onClick() {
    if (this.disable) return;
    this.open = !this.open;
    this.visibilityChange.next(this.open);
  }

  @HostListener('keydown.enter', ['$event'])
  onEnter() {
    if (this.open) return;
    this.onClick();
  }

  @HostListener('keydown.arrowup', ['$event'])
  onArrowUpKey(event: Event) {
    event.preventDefault();
    if (this.keyboardIndex > 0) {
      this.keyboardIndex -= 1;
      this.keyboardNavigation();
    }
  }

  @HostListener('keydown.arrowdown', ['$event'])
  onArrowDownKey(event: Event) {
    event.preventDefault();
    if (this.currentIndexKeyboardItem(this.keyboardIndex + 1)) {
      this.keyboardIndex += 1;
      this.keyboardNavigation();
    }
  }

  private currentIndexKeyboardItem(index: number) {
    return this.arrayOfItems[index];
  }

  keyboardNavigation() {
    const current = this.currentIndexKeyboardItem(this.keyboardIndex);
    const prev = this.currentIndexKeyboardItem(this.keyboardIndex - 1);
    const next = this.currentIndexKeyboardItem(this.keyboardIndex + 1);

    if (prev) {
      prev.activation = false;
    }
    if (next) {
      next.activation = false;
    }

    current!.activation = true;
    current!.native.focus();
  }

  @HostListener('keydown.escape', ['$event'])
  onEscape() {
    this.onClick();
  }

  @HostListener('document:click')
  onClickOutside() {
    this.mouseDown$
      .pipe(
        filter(() => this.open && !this.disable),
        filter((event) => {
          return !this.element.nativeElement.contains(event.target as Node);
        }),
        switchMap((down) => {
          return this.mouseUp$.pipe(
            take(1),
            filter((up) => down.target === up.target)
          );
        }),
        takeUntil(this.notifierEndSub)
      )
      .subscribe(() => {
        this.open = false;
        this.visibilityChange.next(this.open);
        // End the active subscription
        this.notifierEndSub.next();
      });
  }

  @HostBinding('class.ngx-disabled-dropdown')
  get disabled() {
    return this.disable;
  }

  @HostBinding('class.ngx-invalid')
  get invalidated() {
    return this.invalid;
  }

  ngOnDestroy() {
    this.destroy.next();
    this.dropdownService.removeDropdownFromList(this.ID);
  }
}
