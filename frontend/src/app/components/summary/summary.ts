import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-summary',
  imports: [CommonModule, MatCardModule],
  templateUrl: './summary.html',
  styleUrl: './summary.css',
})
export class Summary {
  @Input() resumen: any;
}
