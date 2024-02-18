import { Component } from '@angular/core';
import {
  DropdownModule,
  DropdownService,
} from '../../../projects/ngx-dropdown-ease/src/public-api';

@Component({
  selector: 'app-test-sub',
  standalone: true,
  imports: [DropdownModule],
  templateUrl: './test-sub.component.html',
  styleUrl: './test-sub.component.css',
})
export class TestSubComponent {
  constructor(private dropdownService: DropdownService) {}

  getAllDropdowns() {
    const all = this.dropdownService.getDropdowns();
    console.log(all);
  }
}
