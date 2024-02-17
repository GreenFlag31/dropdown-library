import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { DropdownModule } from '../../projects/ngx-dropdown-ease/src/public-api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslatedValues } from '../../projects/ngx-dropdown-ease/src/lib/interface';
import { DropdownService } from '../../projects/ngx-dropdown-ease/src/lib/dropdown.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, DropdownModule, TranslateModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterViewInit {
  @ViewChild('RBGA') RBGA!: ElementRef<HTMLElement>;
  @ViewChild('language') language!: ElementRef<HTMLElement>;
  @ViewChild('habits') habits!: ElementRef<HTMLElement>;
  @ViewChild('ingredients') ingredients!: ElementRef<HTMLElement>;

  countries = [
    {
      name: 'English',
      img: '../assets/pictures/England.png',
    },
    {
      name: 'French',
      img: '../assets/pictures/France.png',
    },
  ];

  itemSelection = {
    borderLeft: '3px solid green',
  };

  constructor(
    private translateService: TranslateService,
    private dropdownService: DropdownService
  ) {}

  getAllDropdowns() {
    const all = this.dropdownService.getDropdowns();
    console.log(all);
  }

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
    const languagesData: TranslatedValues = {
      dropdown: this.language,
      title: this.translateService.instant('Language'),
      items: [
        this.translateService.instant('English'),
        this.translateService.instant('French'),
      ],
    };
    const colorsData: TranslatedValues = {
      dropdown: this.RBGA,
      title: this.translateService.instant('Colors'),
      items: [
        this.translateService.instant('Red'),
        this.translateService.instant('Green'),
        this.translateService.instant('Blue'),
      ],
    };
    const habitsData: TranslatedValues = {
      dropdown: this.habits,
      title: this.translateService.instant('Habits'),
      items: [
        this.translateService.instant('Wake up'),
        this.translateService.instant('Code'),
        this.translateService.instant('Sleep'),
        this.translateService.instant('Repeat'),
      ],
    };

    return [languagesData, colorsData, habitsData];
  }

  onLanguageChange(language: string) {
    if (language === 'French') {
      this.translateService.use('fr');
    } else {
      this.translateService.use('en');
    }
  }
}
