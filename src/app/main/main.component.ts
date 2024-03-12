import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  DropdownModule,
  DropdownService,
} from '../../../projects/ngx-dropdown-ease/src/public-api';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, DropdownModule, TranslateModule],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class MainComponent {
  countries = [
    {
      name: 'English',
      img: 'assets/pictures/England.png',
    },
    {
      name: 'French',
      img: 'assets/pictures/France.png',
    },
  ];

  itemSelection = {
    borderLeft: '3px solid green',
  };

  constructor(
    private translateService: TranslateService,
    private dropdownService: DropdownService
  ) {}

  ngAfterViewInit() {
    console.log('v0.0.3');
  }

  getContent() {
    console.log(this.dropdownService.getDropdowns());
  }

  onLanguageChange(language: string) {
    if (language === 'French') {
      this.translateService.use('fr');
    } else {
      this.translateService.use('en');
    }
  }
}
