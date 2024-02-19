import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import {
  DropdownModule,
  DropdownService,
} from '../../../projects/ngx-dropdown-ease/src/public-api';
import { TranslateService } from '@ngx-translate/core';
import { TranslatedValues } from '../../../projects/ngx-dropdown-ease/src/lib/interface';

@Component({
  selector: 'app-test-sub',
  standalone: true,
  imports: [DropdownModule],
  templateUrl: './test-sub.component.html',
  styleUrl: './test-sub.component.css',
})
export class TestSubComponent implements AfterViewInit {
  @ViewChild('RGBA') RGBA!: ElementRef<HTMLElement>;

  constructor(
    private dropdownService: DropdownService,
    private translateService: TranslateService
  ) {}

  getAllDropdowns() {
    const all = this.dropdownService.getDropdowns();
    console.log(all);
  }

  ngAfterViewInit() {
    // // Initialisation
    // this.translateService.onDefaultLangChange.subscribe(() => {
    //   this.dropdownService.translate(this.dropdownsData());
    // });
    // // Changing language at runtime
    // this.translateService.onLangChange.subscribe(() => {
    //   this.dropdownService.translate(this.dropdownsData());
    // });
  }

  dropdownsData() {
    const colorsData: TranslatedValues = {
      dropdown: this.RGBA,
      title: this.translateService.instant('Colors'),
      items: [
        this.translateService.instant('Red'),
        this.translateService.instant('Green'),
        this.translateService.instant('Blue'),
      ],
    };

    return [colorsData];
  }
}
