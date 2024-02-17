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
  ChangeDetectorRef,
} from '@angular/core';
import { Subject, filter, fromEvent, switchMap, take, takeUntil } from 'rxjs';
import { DropdownItemDirective } from './dropdown-item.directive';
import { DropdownsData, Select } from './interface';
import { InternalDropdownService } from './internalDropdown.service';
import { DropdownTitleContainerDirective } from './dropdown-title-container.directive';
import { DropdownMenuDirective } from './dropdown-menu.directive';

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
  private defaultTitle = '';
  private titleColor = '#000';
  private defaultColor = '#000';
  private invalid = false;
  private labelMinSelection!: HTMLParagraphElement;
  private keyboardIndex = -1;
  private itemsKeyboardNav!: DropdownItemDirective[];
  private searchbarElement!: HTMLInputElement | undefined;
  private childItems: DropdownItemDirective[] = [];
  private paddingLeft = '';
  private scrollIndex = 0;

  @ContentChild(DropdownTitleContainerDirective)
  dropdownTitleContainer!: DropdownTitleContainerDirective;
  @ContentChild(DropdownTitleDirective) dropdownTitle!: DropdownTitleDirective;
  @ContentChild(DropdownMenuDirective) dropdownMenu!: DropdownMenuDirective;
  @ContentChildren(DropdownItemDirective, { descendants: true })
  dropdownItems!: QueryList<DropdownItemDirective>;

  constructor(
    private element: ElementRef<HTMLElement>,
    private dropdownService: InternalDropdownService,
    private cd: ChangeDetectorRef
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

  ngOnInit() {
    this.onSelectionChange();
    this.onItemSelection();
    this.ID = this.dropdownService.dropdownID;
    this.dropdownService.dropdownID += 1;
  }

  ngAfterContentInit() {
    this.populateDropdownsInTheService();
    this.native.tabIndex = 0;
    this.itemsKeyboardNav = this.dropdownItems.toArray();
    this.childItems = this.dropdownItems.toArray();
    this.displayTitle = this.dropdownTitleContainer.displayTitleOption;
  }

  /**
   * Get the padding for title left value position.
   */
  ngAfterViewInit() {
    this.createLabelMinNumberSelection();
    const computedStyle = window.getComputedStyle(this.native);
    this.paddingLeft = computedStyle.getPropertyValue('padding-left');

    this.addTitleOnTop();
    this.createSearchbar();
  }

  private addTitleOnTop() {
    if (!this.displayTitle) return;

    this.pTitleOnTop = document.createElement('p');
    this.pTitleOnTop.classList.add('ngx-dropdown-title-top');
    this.pTitleOnTop.style.color = this.titleColor;
    this.dropdownTitle.native.style.minHeight =
      this.dropdownTitle.native.clientHeight + 'px';

    this.native.prepend(this.pTitleOnTop);
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
    this.native.prepend(this.labelMinSelection);
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
      translation: false,
    };
    this.dropdownService.addActiveDropdownsAndContent(this.elementAndContent);
  }

  /**
   * If no selection, update main title.
   */
  updateTitleValue(value: string) {
    this.defaultTitle = value;
    if (this.listOfElements.length === 0) {
      this.dropdownTitle.titleContent = value;
    }
  }

  /**
   * Invalidate dropdown (red border) in case of not meeting the requirements.
   */
  setInvalidDropdown(invalid: boolean) {
    this.invalid = invalid;
    this.labelMinSelection.style.visibility = `${
      invalid ? 'visible' : 'hidden'
    }`;
  }

  clearListOfElements() {
    this.listOfElements = [];
  }

  /**
   * Create searchbar and replace dropdown titel with it.
   */
  private createSearchbar() {
    if (!this.searchbar) return;

    this.searchbarElement = document.createElement('input');
    this.searchbarElement.classList.add('ngx-dropdown-searchbar');
    this.searchbarElement.spellcheck = false;
    this.searchbarElement.setAttribute('autocomplete', 'off');
    this.searchbarElement.value = this.defaultTitle;
    this.searchbarElement.addEventListener(
      'input',
      this.onSearchbarInputChange.bind(this)
    );

    this.searchbarElement.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        this.callClickOnItem(event);
      }
    });

    this.dropdownTitle.native.replaceWith(this.searchbarElement);
  }

  /**
   * Pressing Enter on searchbar triggers the search and click method of the respective element.
   */
  private callClickOnItem(e: Event) {
    const index = this.childItems.findIndex((item) => item.activate);
    if (index === -1) return;
    this.childItems[index].onClick(e);
  }

  /**
   * Triggered on input change. Update the array of results for keyboard navigation.
   */
  private onSearchbarInputChange() {
    const searchValue = this.searchbarElement!.value.toLowerCase().trim();
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

    this.itemsKeyboardNav = [...children];
    this.keyboardIndex = -1;
  }

  /**
   * Reset the items for keyboard support navigation.
   */
  private updateElementsKeyboardSupport(items: DropdownItemDirective[]) {
    this.itemsKeyboardNav = items;
  }

  /**
   * Update the default active elements.
   * Push in the list of active elements, add check mark or custom style.
   */
  setDefaultsActiveItems() {
    const arrayDropdownItems = this.dropdownItems.toArray();
    for (let i = 0; i < arrayDropdownItems.length; i++) {
      const current = arrayDropdownItems[i];

      if (this.defaultActiveItems.indexOf(i) === -1) {
        continue;
      }

      const content = current.native.innerText || '';
      current.onItemSelection();
      this.updateTitleAndList(content);

      if (this.selection === 'single') break;
    }

    this.updateSearchbarValue();
    this.dropdownTitleContainer.handleBadge();
  }

  updateSearchbarValue() {
    if (this.searchbarElement) {
      const selected = [...this.listOfElements].reverse().join(', ');
      this.searchbarElement.value = selected || this.defaultTitle;
      this.searchbarElement.title = selected || this.defaultTitle;
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

  private displaySelectedItemInTitle() {
    const selected = [...this.listOfElements].reverse().join(', ');

    this.dropdownTitle.native.innerText = selected || this.defaultTitle;
    this.dropdownTitle.native.title = selected || this.defaultTitle;
  }

  /**
   * In case of searchbar, display back all items.
   */
  private displayAllItems() {
    if (!this.searchbar) return;

    for (const item of this.childItems) {
      item.native.style.display = 'flex';
    }
  }

  private emptySearchbar() {
    if (this.searchbarElement) {
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
        this.emptySearchbar();
        this.updateTitleDisplay();
      } else {
        this.searchbarElement?.blur();
        this.removeClassActiveItem();
        this.updateElementsKeyboardSupport(this.childItems);
        this.updateSearchbarValue();
        this.displaySelectedItemInTitle();

        if (this.listOfElements.length === 0) {
          this.pTitleOnTop.innerText = '';
        }
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
        this.resetSelectionPositionIfSearch();
        this.toggleDisplayBadge(false);
        this.cd.markForCheck();
      });
  }

  private resetSelectionPositionIfSearch() {
    if (this.searchbarElement?.value) {
      this.removeClassActiveItem();
      this.searchbarElement.value = '';
    }
    this.searchbarElement?.focus();
  }

  removeClassActiveItem() {
    this.keyboardIndex = -1;

    for (const item of this.itemsKeyboardNav) {
      item.activation = false;
    }
  }

  /**
   * if option of disabling the title, à vérifier
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

    this.dropdownTitle.titleContent = elementsReversed;
    this.dropdownTitle.native.title = elementsReversed;
  }

  @HostListener('click', ['$event.currentTarget'])
  onClick() {
    if (this.disable) return;
    this.searchbarElement?.focus();
    this.open = !this.open;
    this.visibilityChange.next(this.open);
  }

  @HostListener('keydown.enter', ['$event'])
  onEnter(e: Event) {
    if (this.open) {
      this.callClickOnItem(e);
      return;
    }
    this.onClick();
  }

  @HostListener('keydown.arrowup', ['$event'])
  onArrowUpKey(event: Event) {
    event.preventDefault();

    if (this.keyboardIndex > 0) {
      this.keyboardIndex -= 1;
      this.keyboardNavigation('up');
    }
  }

  @HostListener('keydown.arrowdown', ['$event'])
  onArrowDownKey(event: Event) {
    event.preventDefault();

    if (this.currentIndexKeyboardItem(this.keyboardIndex + 1)) {
      this.keyboardIndex += 1;
      this.keyboardNavigation('down');
    }
  }

  private currentIndexKeyboardItem(index: number) {
    return this.itemsKeyboardNav[index];
  }

  /**
   * Custom scrolling to the active element
   * Because the focus stays on the searchbox, a custom scroll has to be implemented.
   */
  private scrollToActiveElement(direction: 'up' | 'down') {
    const maxElementsVisible = this.dropdownMenu.elementsVisible;
    if (maxElementsVisible === Infinity) return;

    const currentIndex = this.keyboardIndex + 1;

    if (direction === 'down' && currentIndex <= maxElementsVisible) {
      this.dropdownMenu.native.scrollTo({ top: 0 });
      return;
    }

    if (direction === 'up' && currentIndex > this.scrollIndex) {
      return;
    }

    let rest = currentIndex - maxElementsVisible;
    if (direction === 'up') {
      rest = currentIndex - 1;
    }

    const height = this.dropdownMenu.scrollHeight(rest, this.itemsKeyboardNav);

    this.scrollIndex = rest;
    this.dropdownMenu.native.scrollTo({ top: height });
  }

  /**
   * Handle keyboard navigation, put focus and class on active element.
   */
  private keyboardNavigation(direction: 'up' | 'down') {
    const prev = this.currentIndexKeyboardItem(this.keyboardIndex - 1);
    const current = this.currentIndexKeyboardItem(this.keyboardIndex);
    const next = this.currentIndexKeyboardItem(this.keyboardIndex + 1);
    this.scrollToActiveElement(direction);

    if (prev) {
      prev.activation = false;
    }
    if (next) {
      next.activation = false;
    }

    current.activation = true;
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
