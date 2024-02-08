import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { DropdownModule } from '../../projects/ngx-dropdown-ease/src/public-api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DropdownService } from '../../projects/ngx-dropdown-ease/src/lib/dropdown.service';
import { TranslatedValues } from '../../projects/ngx-dropdown-ease/src/lib/interface';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, DropdownModule, TranslateModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('RBGA') RBGA!: ElementRef;
  @ViewChild('language') language!: ElementRef;

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

  ngOnInit() {
    // Initialisation
    this.translateService.onDefaultLangChange.subscribe(() => {
      this.translate();
    });

    // Changing language at runtime
    this.translateService.onLangChange.subscribe(() => {
      this.translate();
    });
  }

  translate() {
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

    this.dropdownService.translation([languagesData, colorsData]);
  }

  ngAfterViewInit() {}

  onLanguageChange(language: string) {
    if (language === 'French') {
      this.translateService.use('fr');
    } else {
      this.translateService.use('en');
    }
  }
}
