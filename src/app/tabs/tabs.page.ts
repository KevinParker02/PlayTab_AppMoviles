import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss']
})
export class TabsPage implements OnInit {
  selectedTab: string = 'tab1'; // Pestaña activa por defecto

  constructor() { }

  ngOnInit() {}

  setSelectedTab(tab: string) {
    this.selectedTab = tab; // Cambia la pestaña seleccionada
  }
}
