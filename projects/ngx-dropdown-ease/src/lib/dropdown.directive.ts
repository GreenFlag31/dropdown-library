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
import { Subject, filter, fromEvent, switchMap, takeUntil } from 'rxjs';
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

  get titleText() {
    return this.native.innerText;
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
  private displaySecondaryTitle = false;
  private secondaryTitle!: HTMLParagraphElement;
  private defaultTitle = '';
  private secondaryTitleColor = '#000';
  private invalid = false;
  private labelMinSelection!: HTMLParagraphElement;
  private keyboardIndex = -1;
  private itemsKeyboardNav!: DropdownItemDirective[];
  private searchbarElement!: HTMLInputElement | undefined;
  private childItems: DropdownItemDirective[] = [];
  private paddingLeft = '';
  private scrollIndex = 0;
  private secondaryTitleAnimation = true;
  private lastSelectionClick = false;
  dropdownItemID = 0;

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

  get native() {
    return this.element.nativeElement;
  }

  get dropdownID() {
    return this.ID;
  }

  get itemID() {
    return this.dropdownItemID;
  }

  get selectionList() {
    return this.listOfElements;
  }

  get currentNumberOfItemsSelected() {
    return this.dropdownTitleContainer.selectionNumber;
  }

  set lastSelectionOnClick(clicked: boolean) {
    this.lastSelectionClick = clicked;
  }

  ngOnInit() {
    this.onSelectionChange();
    this.onItemSelection();
    this.ID = this.dropdownService.dropdownID;
    this.dropdownService.dropdownID += 1;
  }

  ngAfterContentInit() {
    this.itemsKeyboardNav = this.dropdownItems.toArray();
    this.childItems = this.dropdownItems.toArray();
    this.displaySecondaryTitle =
      this.dropdownTitleContainer.displaySecondaryTitle;
    this.secondaryTitleAnimation =
      this.dropdownTitleContainer.animationSecondaryTitle;
    this.defaultTitle = this.dropdownTitle.titleText;
    this.secondaryTitleColor = this.dropdownTitleContainer.secondaryTitleC;
    this.defaultActiveItems = this.dropdownMenu.defaultActive;
    this.populateDropdownsInTheService();
  }

  /**
   * Get the padding for title left value position.
   */
  ngAfterViewInit() {
    this.native.tabIndex = 0;
    this.createLabelMinNumberSelection();
    const computedStyle = window.getComputedStyle(this.native);
    this.paddingLeft = computedStyle.getPropertyValue('padding-left');

    this.addSecondaryTitle();
    this.createSearchbar();
    this.setDefaultsActiveItems();
  }

  private addSecondaryTitle() {
    if (!this.displaySecondaryTitle) return;

    this.secondaryTitle = document.createElement('p');
    this.secondaryTitle.classList.add('ngx-dropdown-title-top');
    this.secondaryTitle.style.color = this.secondaryTitleColor;
    this.native.prepend(this.secondaryTitle);
  }

  private createLabelMinNumberSelection() {
    const minSelection = this.dropdownMenu.minNumberElementsSelection;
    if (minSelection === 0) return;

    this.labelMinSelection = document.createElement('p');
    this.labelMinSelection.classList.add('ngx-label-min-selection');
    this.labelMinSelection.innerText = `Please select min ${minSelection} element${
      minSelection > 1 ? 's' : ''
    }`;
    this.native.prepend(this.labelMinSelection);
  }

  private populateDropdownsInTheService() {
    const activesValue: string[] = [];
    const defaultActive = this.dropdownMenu.defaultActive;

    this.elementAndContent = {
      element: this,
      dropdownID: this.ID,
      activesIndex: defaultActive,
      title: this.dropdownTitle.native.innerText,
      activesValue,
      translation: false,
    };
    this.dropdownService.addActiveDropdownsAndContent(this.elementAndContent);
  }

  /**
   * If no selection, update the title placeholder, else the secondary title.
   */
  updateTitleValue(title: string) {
    this.defaultTitle = title;

    if (this.listOfElements.length === 0) {
      this.dropdownTitleContainer.titleOnPlaceholder = this.defaultTitle;
    } else {
      this.secondaryTitle.innerText = this.defaultTitle;
    }
  }

  /**
   * Invalidate dropdown (red outline) in case of not meeting the requirements.
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
   * Create searchbar, prepend the element and hide the original to not lose eventual translation pipes in the template.
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

    this.dropdownTitleContainer.native.prepend(this.searchbarElement);
    this.dropdownTitle.native.style.display = 'none';
  }

  /**
   * Pressing Enter on searchbar or dropdown triggers the search and click method of the respective element.
   */
  private callClickOnItem(e: Event) {
    const index = this.childItems.findIndex((item) => item.activate);

    if (index === -1) return;
    this.childItems[index].onClick(e);
  }

  /**
   * Triggered on input change. Update the array of results for keyboard navigation.
   * Preselect first result if there are results.
   */
  private onSearchbarInputChange() {
    const searchValue = this.searchbarElement!.value.toLowerCase().trim();
    const results: DropdownItemDirective[] = [];

    for (const item of this.childItems) {
      const element = item.native;
      const text = element.innerText.toLowerCase();

      if (text.includes(searchValue)) {
        results.push(item);
        element.style.display = 'flex';
      } else {
        element.style.display = 'none';
      }
    }

    if (results.length > 0) {
      this.itemsKeyboardNav[0].activation = false;
      this.itemsKeyboardNav = results;
      this.itemsKeyboardNav[0].activation = true;
      this.keyboardIndex = 0;
      this.cd.markForCheck();
    }
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

      if (!this.defaultActiveItems.includes(i)) continue;

      const content = current.native.innerText;
      current.onItemSelection();
      this.updateList(content);

      if (this.selection === 'single') break;
    }

    this.updateSearchbarValue();
    this.dropdownTitleContainer.handleBadge();
  }

  /**
   * Placeholder and title only available on active selection.
   */
  updateSearchbarValue() {
    if (this.searchbarElement) {
      const text = this.reversedOrderSelection() || this.defaultTitle;

      this.searchbarElement.value = text;
      const list = this.listOfElements.length;
      this.searchbarElement.placeholder = `${list ? text : ''}`;
      this.searchbarElement.title = `${text}${list > 1 ? ` (${list})` : ''}`;
    }
  }

  updateSecondaryTitle(animation = this.secondaryTitleAnimation) {
    if (!this.displaySecondaryTitle) return;

    this.secondaryTitle.innerText = this.defaultTitle;

    const keyframes = [{ left: '-5px' }, { left: this.paddingLeft }];
    const options: KeyframeAnimationOptions = {
      duration: animation ? 200 : 0,
      fill: 'forwards',
      easing: 'ease-out',
    };

    this.secondaryTitle.animate(keyframes, options);
  }

  private displaySelectedItemInTitle() {
    // no title placeholder update in case of a searchbar.
    if (this.searchbar) return;

    const text = this.reversedOrderSelection() || this.defaultTitle;
    const list = this.listOfElements.length;

    this.dropdownTitleContainer.titleOnPlaceholder = text;
    this.dropdownTitleContainer.placeholder.title = `${text}${
      list > 1 ? ` (${list})` : ''
    }`;
  }

  /**
   * In case of an active search in the searchbar, display back all items.
   */
  private displayAllItems() {
    if (!this.searchbarElement?.value) return;

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
    const badge = this.dropdownTitleContainer.badgeHasBeenAdded;

    if (badge) {
      this.dropdownTitleContainer.badgeEl.style.display = shouldHide
        ? 'none'
        : 'flex';
    }
  }

  /**
   * Subject triggered on open / close of the menu.
   */
  private onItemSelection() {
    this.visibilityChange.subscribe((visible) => {
      this.open = visible;
      this.displayAllItems();
      this.toggleDisplayBadge(visible);
      this.dropdownTitleContainer.addMinHeightOnTitlePlaceholder();

      if (visible) {
        this.dropdownTitleContainer.titleOnPlaceholder = '';
        this.emptySearchbar();
        this.updateSecondaryTitle();
      } else {
        this.searchbarElement?.blur();
        this.removeClassActiveItems();
        this.updateElementsKeyboardSupport(this.childItems);
        this.updateSearchbarValue();
        this.displaySelectedItemInTitle();

        if (this.secondaryTitle && this.listOfElements.length === 0) {
          this.secondaryTitle.innerText = '';
        }
      }
    });
  }

  /**
   * Subject triggered on item selection.
   */
  private onSelectionChange() {
    this.selectionChange.subscribe((selection) => {
      this.updateList(selection);
      this.updateActiveIndexService(selection);
      this.resetToDefaultTitleNoSecondaryTitle();
      this.displayAllItems();
      this.updateElementsKeyboardSupport(this.childItems);
      this.resetSelectionPositionIfSearch();
      this.toggleDisplayBadge(false);
      this.fillPlaceholderSearchbar();
      this.cd.markForCheck();
    });
  }

  private fillPlaceholderSearchbar() {
    if (!this.searchbarElement) return;

    this.searchbarElement.placeholder = this.reversedOrderSelection();
  }

  private resetSelectionPositionIfSearch() {
    if (this.searchbarElement?.value) {
      this.removeClassActiveItems();
      this.searchbarElement.value = '';
    }
    // Mouse click
    this.searchbarElement?.focus();
  }

  private removeClassAllItems() {
    for (const item of this.childItems) {
      item.activation = false;
    }
  }

  removeClassActiveItems() {
    this.keyboardIndex = -1;
    this.scrollIndex = 0;

    for (const item of this.itemsKeyboardNav) {
      item.activation = false;
    }
  }

  /**
   * If option of secondary title is not enabled.
   */
  private resetToDefaultTitleNoSecondaryTitle() {
    if (!this.displaySecondaryTitle && this.listOfElements.length === 0) {
      this.dropdownTitleContainer.titleOnPlaceholder = this.defaultTitle;
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

  /**
   * Update the content IN PLACE.
   * activesIndex in the service follows the same order as the listOfElements.
   */
  updateTranslationContentInPlace(index: number, text: string) {
    this.listOfElements.splice(index, 1, text);

    this.updateTitleSelection();
    this.updateSearchbarValue();
  }

  updateList(selection: string) {
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

    this.updateTitleSelection();
  }

  private updateTitleSelection() {
    // no title placeholder update in case of a searchbar.
    if (this.searchbar) return;

    const selectionReversed = this.reversedOrderSelection();
    const list = this.listOfElements.length;

    this.dropdownTitleContainer.titleOnPlaceholder = selectionReversed;
    this.dropdownTitleContainer.placeholder.title = `${selectionReversed}${
      list > 1 ? ` (${list})` : ''
    }`;
  }

  /**
   * For UI purposes, show last element selected first.
   */
  private reversedOrderSelection() {
    return [...this.listOfElements].reverse().join(', ');
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
      // keyboard navigation
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
   * Custom scrolling to the active element.
   * Because the focus stays on the searchbox, a custom scroll has to be implemented.
   */
  private scrollToActiveElement(direction: 'up' | 'down') {
    const maxElementsVisible = this.dropdownMenu.elementsVisible;
    if (maxElementsVisible === Infinity) return;

    const currentIndex = this.keyboardIndex + 1;

    if (
      direction === 'down' &&
      currentIndex - this.scrollIndex <= maxElementsVisible
    ) {
      if (this.lastSelectionClick) {
        // if last item was selected with the mouse
        this.dropdownMenu.native.scrollTo({ top: 0 });
      }
      return;
    }

    if (direction === 'up' && currentIndex > this.scrollIndex) {
      return;
    }

    let rest = currentIndex - maxElementsVisible;
    if (direction === 'up') {
      rest = currentIndex - 1;
    }

    const height = this.dropdownMenu.computeTotalHeight(
      rest,
      this.itemsKeyboardNav
    );

    this.scrollIndex = rest;
    this.dropdownMenu.native.scrollTo({ top: height });
  }

  /**
   * Handle keyboard navigation, set class on active element.
   */
  private keyboardNavigation(direction: 'up' | 'down') {
    const current = this.currentIndexKeyboardItem(this.keyboardIndex);
    this.scrollToActiveElement(direction);
    this.removeClassAllItems();

    current.activation = true;
    this.lastSelectionOnClick = false;
  }

  @HostListener('keydown.escape', ['$event'])
  onEscape() {
    this.onClick();
    this.native.blur();
  }

  /**
   * Only a complete click outside will trigger a menu close.
   */
  @HostListener('document:click')
  onClickOutside() {
    this.mouseDown$
      .pipe(
        filter(() => this.open && !this.disable),
        filter((event) => {
          return !this.native.contains(event.target as Node);
        }),
        switchMap((down) => {
          return this.mouseUp$.pipe(filter((up) => down.target === up.target));
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
    this.dropdownService.removeDropdownFromList(this.ID);
  }
}
