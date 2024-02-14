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
  AfterViewInit,
} from '@angular/core';
import {
  Subject,
  empty,
  filter,
  firstValueFrom,
  fromEvent,
  switchMap,
  take,
  takeUntil,
} from 'rxjs';
import { DropdownItemDirective } from './dropdown-item.directive';
import { DropdownsData, Select } from './interface';
import { DropdownService } from './dropdown.service';
import { DropdownTitleContainerDirective } from './dropdown-title-container.directive';
import { DropdownMenuDirective } from './dropdown-menu.directive';
import { InstantiateExpr } from '@angular/compiler';

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

  get titleContent() {
    return this.native.innerText;
  }

  set titleContent(value: string) {
    this.native.innerText = value;
  }
}

@Directive({
  selector: '[ngxDropdown]',
  standalone: true,
  host: { class: 'ngx-dropdown' },
})
export class DropdownDirective
  implements OnInit, AfterContentInit, AfterViewInit, OnDestroy
{
  @Input() selection: Select = 'single';
  @Input() defaultTitle = '';
  @Input() disable = false;
  @Input() searchbar = false;

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
  private displayTitle = false;
  private pTitleOnTop!: HTMLParagraphElement;
  private titleColor = '#000';
  private defaultColor = '#000';
  private invalid = false;
  private labelMinSelection!: HTMLParagraphElement;
  private keyboardIndex = -1;
  private arrayOfItems!: (DropdownItemDirective | HTMLElement)[];
  private searchbarElement!: HTMLInputElement | undefined;
  private childItems: DropdownItemDirective[] = [];
  private paddingLeft = '';

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

  /**
   * if no selection, update main title.
   */
  updateTitleValue(value: string) {
    this.defaultTitle = value;
    if (this.listOfElements.length === 0) {
      this.dropdownTitle.titleContent = value;
    }
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

  ngAfterContentInit() {
    this.createLabelMinNumberSelection();
    this.populateDropdownsInTheService();
    this.addTabIndex();
    this.arrayOfItems = this.dropdownItems.toArray();
    this.displayTitle = this.dropdownMenu.displayTitleOption;
  }

  ngAfterViewInit() {
    const computedStyle = window.getComputedStyle(this.native);
    this.paddingLeft = computedStyle.getPropertyValue('padding-left');

    this.addTitleOnTop();
    this.createSearchbar();
  }

  private createSearchbar() {
    if (!this.searchbar) return;

    this.searchbarElement = document.createElement('input');
    this.searchbarElement.classList.add('ngx-dropdown-searchbar');
    this.searchbarElement.value = this.defaultTitle;
    const dropdownNative = this.dropdownTitleContainer.native;
    this.searchbarElement.addEventListener(
      'input',
      this.onSearchbarInputChange.bind(this)
    );

    this.childItems = this.dropdownItems.toArray();
    dropdownNative.firstChild?.remove();
    dropdownNative.prepend(this.searchbarElement);
  }

  private resetAllFielsItems() {
    if (!this.searchbarElement) return;

    this.searchbarElement.blur();
    if (this.listOfElements.length === 0) {
      for (const item of this.childItems) {
        item.native.style.display = 'flex';
      }
    }
  }

  private onSearchbarInputChange() {
    const searchValue = this.searchbarElement!.value.toLowerCase();
    const children: DropdownItemDirective[] = [];

    for (const item of this.childItems) {
      const element = item.native;
      const text = element.innerText.toLowerCase();

      if (text.includes(searchValue)) {
        children.push(item);
        element.style.display = 'flex';
      } else {
        element.style.display = 'none';
      }
    }

    if (!this.open) {
      this.onClick();
    }

    // not displaying the unselect option while searching
    this.dropdownMenu.changeUnselectVisibility(false);
    this.updateElementsKeyboardSupport(children);
    this.keyboardIndex = -1;
  }

  /**
   * Update for keyboard support. The array contains the search results.
   */
  private updateElementsKeyboardSupport(items: DropdownItemDirective[]) {
    if (!this.searchbarElement) return;

    if (this.arrayOfItems[0] instanceof HTMLElement) {
      // keep unselect option
      this.arrayOfItems = [this.arrayOfItems[0], ...items];
    } else {
      this.arrayOfItems = [...items];
    }
  }

  addUnselectToKeyboardSupport(unselectElement: HTMLElement) {
    this.arrayOfItems.unshift(unselectElement);
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
      this.updateTitleAndList(content);
      this.dropdownTitleContainer.handleBadge();

      if (this.selection === 'single') break;
    }
  }

  setTitleColor(defaultColor: string, color: string) {
    this.defaultColor = defaultColor;
    this.titleColor = color;
  }

  updateTitleOnTop(title: string) {
    if (!this.pTitleOnTop) return;
    this.pTitleOnTop.innerText = title;
  }

  addTitleOnTop() {
    if (!this.displayTitle) return;

    this.pTitleOnTop = document.createElement('p');
    this.pTitleOnTop.classList.add('ngx-dropdown-title-top');
    this.pTitleOnTop.style.color = this.titleColor;
    this.dropdownTitle.native.style.minHeight =
      this.dropdownTitle.native.clientHeight + 'px';

    this.element.nativeElement.prepend(this.pTitleOnTop);
  }

  /**
   * In case of translation and zero active items, update the title on top.
   */
  updateTitleDisplay(animation = true) {
    if (!this.displayTitle) return;

    // from translation service
    if (this.listOfElements.length === 0 && !this.open) {
      return;
    }

    this.pTitleOnTop.innerText = this.defaultTitle;

    const keyframes = [{ left: '-5px' }, { left: this.paddingLeft }];
    const options: KeyframeAnimationOptions = {
      duration: animation ? 200 : 0,
      fill: 'forwards',
      easing: 'ease-out',
    };

    this.pTitleOnTop.animate(keyframes, options);
  }

  /**
   * If the menu is closed, show back the selected elements
   */
  private displaySelectedItemInSearchbar() {
    if (this.searchbarElement) {
      this.searchbarElement.value = [...this.listOfElements]
        .reverse()
        .join(', ');
    }
  }

  private displaySelectedItemInTitle() {
    this.dropdownTitle.native.innerText = [...this.listOfElements]
      .reverse()
      .join(', ');
  }

  /**
   * In case of searchbar, display back all items.
   */
  private displayAllItems() {
    for (const item of this.childItems) {
      item.native.style.display = 'flex';
    }
  }

  private emptySearchbarIfSameElements() {
    if (this.searchbarElement?.value) {
      this.searchbarElement.value = '';
    }
  }

  private toggleDisplayBadge(shouldHide: boolean) {
    const badge =
      this.dropdownTitleContainer.native.querySelector<HTMLSpanElement>(
        '.ngx-badge'
      );

    if (badge) {
      badge.style.display = shouldHide ? 'none' : 'block';
    }
  }

  private onItemSelection() {
    this.visibilityChange.pipe(takeUntil(this.destroy)).subscribe((visible) => {
      this.open = visible;
      this.displayAllItems();
      this.toggleDisplayBadge(visible);

      if (!this.displayTitle) return;

      if (visible) {
        this.dropdownTitle.native.innerText = '';
        this.emptySearchbarIfSameElements();
        this.updateTitleDisplay();
      } else {
        this.searchbarElement?.blur();
        this.removeClassActiveItem();

        if (this.listOfElements.length > 0) {
          this.displaySelectedItemInSearchbar();
          this.displaySelectedItemInTitle();
          return;
        }

        if (this.searchbarElement) {
          this.searchbarElement.value = this.defaultTitle;
        }

        this.dropdownTitle.titleContent = this.defaultTitle;
        this.pTitleOnTop.innerText = '';
      }
    });
  }

  private onSelectionChange() {
    this.selectionChange
      .pipe(takeUntil(this.destroy))
      .subscribe((selection) => {
        this.updateTitleAndList(selection);
        this.updateActiveIndexService(selection);
        this.resetToDefaultTitle();
        this.displayAllItems();
        this.updateElementsKeyboardSupport(this.childItems);
        this.toggleDisplayBadge(false);
      });
  }

  private removeClassActiveItem() {
    this.keyboardIndex = -1;

    for (const item of this.arrayOfItems) {
      if (item instanceof HTMLElement) {
        item.classList.remove('active');
      } else {
        item.activation = false;
      }
    }
  }

  /**
   * if option of disabling the title
   */
  resetToDefaultTitle() {
    if (!this.displayTitle && this.listOfElements.length === 0) {
      this.dropdownTitle.titleContent = this.defaultTitle;
    }
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

  updateTitleAndList(selection: string) {
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

    const elementsReversed = [...this.listOfElements].reverse().join(', ');

    if (this.searchbarElement) {
      this.searchbarElement.value = elementsReversed;
      this.searchbarElement.title = elementsReversed;
    }
    this.dropdownTitle.titleContent = elementsReversed;
    this.dropdownTitle.native.title = elementsReversed;
  }

  @HostListener('click', ['$event.currentTarget'])
  onClick() {
    if (this.disable) return;
    if (this.searchbarElement) {
      this.searchbarElement.focus();
    }
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

    if (this.keyboardIndex === 0 && this.searchbarElement) {
      this.searchbarElement.focus();
      this.searchbarElement.value = '';
      this.removeClassActiveItem();
    }

    if (this.keyboardIndex > 0) {
      this.keyboardIndex -= 1;
      this.keyboardNavigation();
    }
  }

  @HostListener('keydown.arrowdown', ['$event'])
  onArrowDownKey(event: Event) {
    event.preventDefault();
    if (this.keyboardIndex === 0 && this.dropdownMenu.unselectOption) {
      (this.arrayOfItems[0] as HTMLElement).classList.remove('active');
    }

    if (this.currentIndexKeyboardItem(this.keyboardIndex + 1)) {
      this.keyboardIndex += 1;
      this.keyboardNavigation();
    }
  }

  private currentIndexKeyboardItem(index: number) {
    return this.arrayOfItems[index];
  }

  /**
   * Handle keyboard navigation, put focus and class on active element.
   */
  private keyboardNavigation() {
    const prev = this.currentIndexKeyboardItem(this.keyboardIndex - 1);
    const current = this.currentIndexKeyboardItem(this.keyboardIndex);
    const next = this.currentIndexKeyboardItem(this.keyboardIndex + 1);

    if (prev && prev instanceof DropdownItemDirective) {
      prev.activation = false;
    }
    if (next && next instanceof DropdownItemDirective) {
      next.activation = false;
    }

    if (current instanceof DropdownItemDirective) {
      current.activation = true;
      current.native.focus();
    } else {
      current.classList.add('active');
      current.focus();
    }
  }

  @HostListener('keydown.escape', ['$event'])
  onEscape() {
    this.onClick();
    this.resetAllFielsItems();
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
