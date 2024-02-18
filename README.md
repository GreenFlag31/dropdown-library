# ngx-modal-ease

# Description

ngx-modal-ease is a versatile Angular library providing a simple, performant, and accessible dropdown. This library supports single or multiple items selection, translation, keyboard navigation, and many other options.

Support Angular version starts at v17.

# Demo

Live demonstration of the ngx-modal-ease library [here](https://greenflag31.github.io/dropdown-library/ngx-dropdown-ease).

# Installation

You can install the library using the following command:

```shell
npm i ngx-dropdown-ease
```

Add the `DropdownModule` containing all the directives to your module or standalone component.

# Options

This library consists in a set of directives to apply in the template containing each a range of options:

```html
<div ngxDropdown selection="multiple" [searchbar]="true" class="selection-container orders" #ingredients>
  <div ngxDropdownTitleContainer secondarytitleColor="red">
    <h4 ngxDropdownTitle>Ingredients</h4>
  </div>
  <div ngxDropdownMenu animation="going-down 0.3s" [elementsVisible]="5">
    <p ngxDropdownItem>Pepperoni</p>
    <p ngxDropdownItem>Mozzarella</p>
    <p ngxDropdownItem>Mushrooms</p>
    <p ngxDropdownItem>Chicken</p>
    <p ngxDropdownItem>Onions</p>
    <p ngxDropdownItem>Peppers</p>
  </div>
</div>
```

| Directive                 | Option                    | Default  | Description                                                                                                                |
| ------------------------- | ------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| ngxDropdown               | selection                 | single   | Selection behavior of the dropdown. Value: 'single' or 'multiple'                                                          |
| ngxDropdown               | disable                   | false    | Disable the dropdown.                                                                                                      |
| ngxDropdown               | searchbar                 | false    | Enable a searchbar in the dropdown.                                                                                        |
| ngxDropdownTitleContainer | badge                     | false    | Display a badge containing the active selection number.                                                                    |
| ngxDropdownTitleContainer | icon                      | true     | Display the arrow down icon in the title.                                                                                  |
| ngxDropdownTitleContainer | iconColor                 | #000     | Set the color or the title icon.                                                                                           |
| ngxDropdownTitleContainer | mainTitleColor            | #000     | Set the color of the main title.                                                                                           |
| ngxDropdownTitleContainer | secondaryTitle            | true     | Display the secondary title.                                                                                               |
| ngxDropdownTitleContainer | secondaryTitleAnimation   | true     | Enable the animation on the secondary title.                                                                               |
| ngxDropdownTitleContainer | secondarytitleColor       | #000     | Set the color of the secondary title.                                                                                      |
| ngxDropdownMenu           | position                  | bottom   | Set the position of the dropdown at opening. Value: 'bottom' or 'top'.                                                     |
| ngxDropdownMenu           | defaultActiveItems        | []       | An zero indexed array containing the default active items index. [0] for the first item to be active by default.           |
| ngxDropdownMenu           | elementsVisible           | Infinity | The maximum number of element that should be visible at opening. A scroll bar will possibly appear.                        |
| ngxDropdownMenu           | animation                 | none     | Define the opening animation. See build-in animation [here](#build-in).                                                    |
| ngxDropdownMenu           | animationTimingMs         | 300      | Set the duration of the opening animation in ms.                                                                           |
| ngxDropdownMenu           | animationTimingFn         | ease     | Set the timing function for the opening animation. Value: 'ease', 'ease-in', 'ease-out', cubic-bezier, ...                 |
| ngxDropdownMenu           | minNumberElementsToSelect | 0        | Define a minimum number of elements to select. A label on top of the dropdown will appear.                                 |
| ngxDropdownMenu           | iconSelection             | check    | Define the item style at selection. Choose between a check mark or custom style respecting the `StyleSelection` interface. |
| ngxDropdownMenu           | iconColor                 | green    | Define the color of the check mark.                                                                                        |
| ngxDropdownItem           | disable                   | false    | Disable the item for selection.                                                                                            |

```typescript
StyleSelection {
  backgroundColor?: string;
  color?: string;
  borderLeft?: string;
  fontWeight?: string;
}
```

# DropdownService

This library exposes a `DropdownService` that contains the following API:

```javascript
// Initialise translation at start
initialise(translatedValues: TranslatedValues[]);

// Update translation at runtime
update(translatedValues: TranslatedValues[]);

// Get the list of your items text content for translation
getListOfElements(dropdown: ElementRef);

// Get all active dropdowns and content
getDropdowns();
```

See the next section for a complete example using translation.

# Translation

This library supports translation by a third party library of your choice. The following example utilise the '@ngx-translate/core' library.

Translated values should be provided at start and at language change through the following methods:

```javascript
// DOM content should be ready
ngAfterViewInit() {
  // Initialisation
  this.translateService.onDefaultLangChange.subscribe(() => {
    this.dropdownService.initialise(this.dropdownsData());
  });

  // Changing language at runtime
  this.translateService.onLangChange.subscribe(() => {
    this.dropdownService.update(this.dropdownsData());
  });
}

dropdownsData() {
  const colorsData: TranslatedValues = {
    // @ViewChild ElementRef to identify the current dropdown
    dropdown: this.RGBA,

    // Title text content
    title: this.translateService.instant('Colors'),

    // Items text content (same as the HTML order)
    items: [
      this.translateService.instant('Red'),
      this.translateService.instant('Green'),
      this.translateService.instant('Blue'),
    ],
  };


  return [colorsData];
}
```

Provide an object respecting following interface:

```typescript
interface TranslatedValues {
  // The @ViewChild ElementRef that you attached to the ngxDropdown directive
  dropdown: ElementRef;
  // The ngxDropdownTitle title text content
  title: string;
  // All the ngxDropdownItem text content
  items: string[];
}
```

If you have a long list of items or you don't want to fill it manually, you can call the `getListOfElements(dropdown: ElementRef)` method of the `DropdownService`. Pass as first argument the same `ElementRef` that you provided to the `TranslatedValues` object. `getListOfElements` will return an array of your items text content (string[]), so that you can iterate over and call the translation method of your translation library (here, `this.translateService.instant(value)`). This method should be synchronous.

Translating content requires an extra step, but this is by far the cleanest solution to handle an asynchronous third party library.

<a id="build-in"></a>

# Ready-to-use animations keyframes

This library comes with build-in and ready-to-use animations keyframes to animate the opening menu. Just fill in the `name`, `duration` and `easing function` (more info on the `animation CSS shorthand` [here](https://developer.mozilla.org/en-US/docs/Web/CSS/animation)).

You have the choice for the opening menu animation between 'none' | 'expand' | any following build-in animations | or creating your own keyframes. Dropdowns automatically adjust their
opening position if there is not enough space for the items to be
displayed. If you use built-in animations, they will be adjusted
accordingly to ensure that the effect remains consistent.

```css
@keyframes going-down {
  from {
    transform: translateY(-5%);
  }
  to {
    transform: translateY(0);
  }
}
@keyframes going-up {
  from {
    transform: translateY(5%);
  }
  to {
    transform: translateY(0);
  }
}
@keyframes going-left {
  from {
    transform: translateX(5%);
  }
  to {
    transform: translateX(0);
  }
}
@keyframes going-right {
  from {
    transform: translateX(-5%);
  }
  to {
    transform: translateX(0);
  }
}
@keyframes scale-up-bottom {
  from {
    transform: scale(0.95);
    transform-origin: bottom;
  }
  to {
    transform: scale(1);
    transform-origin: bottom;
  }
}
@keyframes scale-up-top {
  from {
    transform: scale(0.95);
    transform-origin: top;
  }
  to {
    transform: scale(1);
    transform-origin: top;
  }
}
@keyframes scale-up {
  from {
    transform: scale(0.95);
  }
  to {
    transform: scale(1);
  }
}
```

# Style customisation

This library offers a basic style customisation API. A class based CSS approach has been favored, so you can _almost_ style everything. Directives attached to the DOM do not cause style encapsulation, so you can style the corresponding classes in the styling sheet of the hosting component as you would normally do for any html element (no need of `ViewEncapsulation.None`). Find the corresponding classes by inspecting the DOM.

Following example changes the background color and the color of the menu:

```
.coding .ngx-dropdown-menu {
  background: #00316cc1;
  color: #fff;
}
```

Classes have been prefixed with ngx-\*.

# Accessibility

This library has been build with accessibility in mind. Dropdowns are keyboard accessible and an alternative text is added where necessary for screen readers.

# DX Friendly

This library has been documented and should provide autocomplete and help from your code editor. Tested on VS Code.

# Performance

Even if this library has been optimised and follows the DRY principles (tested under the `ChangeDetectionStrategy.OnPush` strategy), it is _not recommended_ by Angular to display several hundreds of directives and a page (see [here](https://angular.io/guide/directive-composition-api#performance) in the documentation). If you have a lot of dropdowns in a page inside a list, you should rather opt for a pagination system.

# Change log

# Report a Bug

Please provide a detailed description of the encountered bug, including your options and the steps/actions that led to the issue. An accurate description will help me to reproduce the issue.

# Ngx-ease serie

You like this library? Discover the ngx-ease serie [here](https://www.npmjs.com/~greenflag31).
