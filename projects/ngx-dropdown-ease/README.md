# ngx-dropdown-ease

# Description

ngx-dropdown-ease is a versatile Angular library providing a simple, performant, and accessible dropdown. This library supports single or multiple items selection, translation, keyboard navigation, and many other options.

Support Angular version starts at v17.

# Demo

Live demonstration of the ngx-dropdown-ease library [here](https://greenflag31.github.io/dropdown-library/ngx-dropdown-ease).

# Installation

You can install the library using the following command:

```
npm i ngx-dropdown-ease
```

Import the stylesheet in your `styles.css`:
`@import "../node_modules/ngx-dropdown-ease/src/lib/dropdown.css";`

Add the `DropdownModule` to your module or standalone component.

# Usage

This library consists in a set of directives to apply in the template containing each a range of options:

```html
<div ngxDropdown selection="multiple" [searchbar]="true">
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
| ngxDropdownTitleContainer | badge                     | false    | Display a badge containing the active selection number. Not available with a searchbar.                                    |
| ngxDropdownTitleContainer | icon                      | true     | Display the arrow down icon in the title.                                                                                  |
| ngxDropdownTitleContainer | iconColor                 | #000     | Set the color of the title icon.                                                                                           |
| ngxDropdownTitleContainer | mainTitleColor            | #000     | Set the color of the main title.                                                                                           |
| ngxDropdownTitleContainer | secondaryTitle            | true     | Display the secondary title.                                                                                               |
| ngxDropdownTitleContainer | secondaryTitleAnimation   | true     | Enable the animation on the secondary title.                                                                               |
| ngxDropdownTitleContainer | secondarytitleColor       | #000     | Set the color of the secondary title.                                                                                      |
| ngxDropdownMenu           | position                  | bottom   | Set the position of the dropdown at opening. Value: 'bottom' or 'top'.                                                     |
| ngxDropdownMenu           | defaultActiveItems        | []       | An zero indexed array containing the default active items index. [0] for the first item to be active by default.           |
| ngxDropdownMenu           | elementsVisible           | Infinity | The maximum number of element that should be visible at opening. A scrollbar will possibly appear.                         |
| ngxDropdownMenu           | animation                 | none     | Define the opening animation. See build-in animation [here](#build-in).                                                    |
| ngxDropdownMenu           | animationTimingMs         | 300      | Set the duration of the opening animation in ms.                                                                           |
| ngxDropdownMenu           | animationTimingFn         | ease     | Set the timing function for the opening animation. Value: 'ease', 'ease-in', 'ease-out', cubic-bezier, ...                 |
| ngxDropdownMenu           | minNumberElementsToSelect | 0        | Define a minimum number of elements to select. A label in english on top of the dropdown will appear.                      |
| ngxDropdownMenu           | iconSelection             | check    | Define the item style at selection. Choose between a check mark or custom style respecting the `StyleSelection` interface. |
| ngxDropdownMenu           | iconColor                 | green    | Define the color of the check mark.                                                                                        |
| ngxDropdownItem           | disable                   | false    | Disable the item for selection.                                                                                            |

```javascript
StyleSelection {
  backgroundColor?: string;
  color?: string;
  borderLeft?: string;
  fontWeight?: string;
}
```

# DropdownService

This library exposes a `DropdownService` containing the following API:

```javascript
getDropdowns();
```

This method returns an array of active dropdowns containing their respective detailed informations.

```javascript
interface Dropdown {
  element: HTMLElement;
  itemsValue: string[];
  activesValue: string[];
  activesIndex: number[];
  labelMinimumSelection: boolean;
  selection: "single" | "multiple";
  translation: boolean;
}
```

# Translation

This library supports translation by a third party library of your choice. The following example utilise the '@ngx-translate/core' library with a translate pipe in the template.

Simply provide the `onItemTranslation` and the `onTitleTranslation` pipes at the end of your template expression:

```html
<div ngxDropdown>
  <div ngxDropdownTitleContainer>
    <h4 ngxDropdownTitle>{{ "Colors" | translate | onTitleTranslation }}</h4>
  </div>
  <div ngxDropdownMenu>
    <p ngxDropdownItem>{{ "Red" | translate | onItemTranslation }}</p>
    <p ngxDropdownItem>{{ "Green" | translate | onItemTranslation }}</p>
    <p ngxDropdownItem>{{ "Blue" | translate | onItemTranslation }}</p>
  </div>
</div>
```

The active selection and the secondary title (the title on top of the dropdown) will be accordingly updated at initialisation or when changing the language at runtime.

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

This library offers a basic style customisation API. A class based CSS approach has been favored, so you can _almost_ style everything. Add `ViewEncapsulation.None` to your component. Find the corresponding classes by inspecting the DOM.

Following example changes the background color and the color of the menu:

```css
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

Even if this library has been optimised and follows DRY principles (tested under the `ChangeDetectionStrategy.OnPush` strategy), it is _not recommended_ by Angular to display several hundreds of directives and a page (see [here](https://angular.io/guide/directive-composition-api#performance) in the documentation). If you have a lot of dropdowns in a page inside a list, you should rather opt for a pagination system.

# Change log

V0.0.3: Simplification of the translation system by adding pipes in the template. Adding a preselection of the first item in case of searching an item in a dropdown where searchbar is enabled.

# Report a Bug

Please provide a detailed description of the encountered bug, including your options and the steps/actions that led to the issue. An accurate description will help me to reproduce the issue.

# Ngx-ease serie

You like this library? Discover the ngx-ease serie [here](https://www.npmjs.com/~greenflag31).
