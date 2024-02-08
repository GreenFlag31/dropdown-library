import {
  OnInit,
  Directive,
  ElementRef,
  HostListener,
  Input,
  AfterViewInit,
  OnDestroy,
  ContentChild,
  ContentChildren,
  QueryList,
  AfterContentInit,
} from '@angular/core';
import { Subject, filter, fromEvent, switchMap, take, takeUntil } from 'rxjs';
import { DropdownItemDirective } from './dropdown-item.directive';
import { DropdownsData, Select } from './interface';
import { DropdownService } from './dropdown.service';

@Directive({
  selector: '[ngxDropdownTitle]',
  standalone: true,
  host: { class: 'dropdown-title' },
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
  host: { class: 'dropdown' },
})
export class DropdownDirective
  implements OnInit, AfterContentInit, AfterViewInit, OnDestroy
{
  @Input() selection: Select = 'single';
  @Input() defaultTitle = '';
  @Input() defaultActiveItems: number[] = [];

  visibilityChange = new Subject<boolean>();
  selectionChange = new Subject<string>();
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
  defaultColor = '#000';

  @ContentChild(DropdownTitleDirective) dropdownTitle!: DropdownTitleDirective;
  @ContentChildren(DropdownItemDirective, { descendants: true })
  dropdownItems!: QueryList<DropdownItemDirective>;

  constructor(
    private element: ElementRef<HTMLElement>,
    private dropdownService: DropdownService
  ) {}

  set default_title(value: string) {
    this.defaultTitle = value;
  }

  get default_title() {
    return this.defaultTitle;
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

  getListOfElements() {
    return this.listOfElements;
  }

  addListItem(item: string) {
    this.listOfElements.push(item);
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
    const itemsValue = [];
    for (const item of this.dropdownItems) {
      itemsValue.push(item.native.innerText);
    }

    this.elementAndContent = {
      element: this,
      dropdownID: this.ID,
      activesIndex: this.defaultActiveItems,
      title: this.dropdownTitle.native.innerText,
      itemsValue,
      updated: false,
    };
    this.dropdownService.addActiveDropdownsAndContent(this.elementAndContent);
  }

  ngAfterViewInit() {}

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
      this.listOfElements.push(content);
      // styling
      current.onItemSelection();
      this.selectionChange.next(content);

      if (this.selection === 'single') break;
    }
  }

  setTitleColor(defaultColor: string, color: string) {
    this.defaultColor = defaultColor;
    this.titleColor = color;
  }

  updateTitleValue(value: string) {
    this.defaultTitle = value;
  }

  displayTitleOnTop(animation = true) {
    if (
      this.dropdownService.getDropdown(this.ID).activesIndex.length === 0 &&
      !this.open
    ) {
      return;
    }

    if (!this.pTitleOnTop) {
      this.pTitleOnTop = document.createElement('p');
      this.pTitleOnTop.classList.add('dropdown-title-top');
      this.pTitleOnTop.style.color = this.titleColor;
      this.element.nativeElement.prepend(this.pTitleOnTop);
      // this.dropdownTitle.native.style.height =
      //   this.dropdownTitle.native.clientHeight + 'px';
    }

    this.pTitleOnTop.innerText = this.defaultTitle;
    // this.pTitleOnTop.style.color = this.titleColor;
    // this.dropdownTitle.native.innerText = '';
    // this.titleIsOnTop = true;

    this.pTitleOnTop.style.animation = `up-title ${
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
      if (!this.listOfElements.includes(selection)) {
        this.listOfElements.push(selection);
      } else {
        this.listOfElements.splice(this.listOfElements.indexOf(selection), 1);
      }
    } else {
      this.listOfElements = [selection];
    }

    // renverser l'ordre??
    dropdownTitle.innerText = this.listOfElements.join(', ');
    dropdownTitle.title = dropdownTitle.innerText;
  }

  @HostListener('click', ['$event.target'])
  onClick() {
    this.open = !this.open;
    this.visibilityChange.next(this.open);
  }

  @HostListener('document:click')
  onClickOutside() {
    this.mouseDown$
      .pipe(
        filter(() => this.open),
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

  ngOnDestroy() {
    this.destroy.next();
    this.dropdownService.removeDropdownFromList(this.ID);
  }
}
