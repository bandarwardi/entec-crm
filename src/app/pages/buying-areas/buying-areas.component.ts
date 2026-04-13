import { Component, OnInit, AfterViewInit, PLATFORM_ID, inject, effect } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import * as L from 'leaflet';
import { OrdersStore } from '../../core/stores/orders.store';
import { OrderStatus } from '../../core/services/sales.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-buying-areas',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="card font-tajawal shadow-md border-t-4 border-t-primary rounded-[2rem] dark:bg-surface-900 overflow-hidden transition-all hover:shadow-lg">
      <div class="p-8 bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-900 dark:to-teal-800 relative overflow-hidden">
        <!-- Decorative background elements -->
        <div class="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl"></div>

        <div class="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
          <div>
            <h1 class="text-4xl font-black text-white mb-2 flex items-center gap-3">
              <i class="pi pi-map-marker text-3xl"></i>
              {{ 'buying_areas.title' | t }}
            </h1>
            <p class="text-emerald-50/80 font-bold text-xs uppercase tracking-widest">{{ 'buying_areas.subtitle' | t }}</p>
          </div>
          
          <div class="flex flex-wrap items-center gap-6 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
            <div class="flex items-center gap-3">
              <span class="w-3.5 h-3.5 rounded-full bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.5)]"></span>
              <span class="text-xs font-black text-white uppercase tracking-wider">{{ 'buying_areas.status.completed' | t }}</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]"></span>
              <span class="text-xs font-black text-white uppercase tracking-wider">{{ 'buying_areas.status.pending' | t }}</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="w-3.5 h-3.5 rounded-full bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]"></span>
              <span class="text-xs font-black text-white uppercase tracking-wider">{{ 'buying_areas.status.cancelled' | t }}</span>
            </div>
          </div>
        </div>
      </div>
      <div id="map" class="h-[700px] w-full z-10 dark:invert-[0.9] dark:hue-rotate-[180deg] dark:brightness-[1.2] dark:contrast-[1.2]"></div>
    </div>
  `,
  styles: [`
    :host ::ng-deep {
      .leaflet-container {
        font-family: 'Tajawal', sans-serif;
      }
      .order-popup {
        direction: rtl;
        text-align: right;
        min-width: 200px;
        color: #334155;
      }
      .app-dark .order-popup {
        color: #f1f5f9;
        /* To cancel the effect of invert on popups if needed, but since popups are children of map, they get inverted too.
           We might need to double-invert them or keep it simple. */
      }
      /* Double inversion to keep popups and markers original colors while map is dark */
      .app-dark .leaflet-popup-content-wrapper,
      .app-dark .leaflet-popup-tip,
      .app-dark .leaflet-marker-icon,
      .app-dark .leaflet-marker-shadow,
      .app-dark .leaflet-bar {
        filter: invert(1) hue-rotate(180deg) brightness(1) contrast(1);
      }
      .app-dark .leaflet-popup-content-wrapper {
        background: #1e293b;
      }
      .app-dark .order-popup .text-teal-700 {
        color: #2dd4bf;
      }
      .app-dark .order-popup .text-slate-500 {
        color: #94a3b8;
      }
    }
  `]
})
export class BuyingAreasComponent implements OnInit, AfterViewInit {
  private map!: L.Map;
  private platformId = inject(PLATFORM_ID);
  private i18n = inject(I18nService);
  readonly ordersStore = inject(OrdersStore);
  private markers: L.Marker[] = [];
  private circles: L.Circle[] = [];

  constructor() {
    // React to orders changes
    effect(() => {
      const orders = this.ordersStore.entities();
      if (this.map && orders.length > 0) {
        this.updateMarkers();
      }
    });
  }

  ngOnInit(): void {
    // Load orders - using a large limit for map visualization
    this.ordersStore.loadOrders({ page: 1, limit: 1000 });
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initMap();
    }
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [23.8859, 45.0792],
      zoom: 6
    });

    L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 18,
      minZoom: 3,
      attribution: '&copy; Google Maps',
      subdomains: ['mt0','mt1','mt2','mt3']
    }).addTo(this.map);

    // Fix for Leaflet default icon issues
    const iconDefault = L.icon({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;

    // Initial update if orders already loaded
    if (this.ordersStore.entities().length > 0) {
      this.updateMarkers();
    }
  }

  private updateMarkers(): void {
    // Clear existing markers/circles
    this.markers.forEach(m => this.map.removeLayer(m));
    this.circles.forEach(c => this.map.removeLayer(c));
    this.markers = [];
    this.circles = [];

    const ordersWithCoords = this.ordersStore.entities().filter(o => 
      o.customer?.latitude && o.customer?.longitude
    );

    if (ordersWithCoords.length === 0) return;

    ordersWithCoords.forEach(order => {
      const lat = order.customer.latitude!;
      const lng = order.customer.longitude!;
      const color = this.getStatusColor(order.status);

      // Add circle for visual density
      const circle = L.circle([lat, lng], {
        color: color,
        fillColor: color,
        fillOpacity: 0.2,
        radius: 1000 // 1km radius
      }).addTo(this.map);
      this.circles.push(circle);

      // Add marker
      const marker = L.marker([lat, lng]).addTo(this.map);
      this.markers.push(marker);

      const popupContent = `
        <div class="order-popup">
          <div class="font-bold text-teal-700 mb-1 border-b pb-1">${this.i18n.t('buying_areas.popup.order')} #${order.id}</div>
          <div class="mb-1"><strong>${this.i18n.t('buying_areas.popup.customer')}:</strong> ${order.customer.name}</div>
          <div class="mb-1"><strong>${this.i18n.t('buying_areas.popup.phone')}:</strong> ${order.customer.phone}</div>
          <div class="mb-1"><strong>${this.i18n.t('buying_areas.popup.amount')}:</strong> ${order.amount} $</div>
          <div class="mb-1"><strong>${this.i18n.t('buying_areas.popup.status')}:</strong> ${this.getStatusText(order.status)}</div>
          <div class="text-xs text-slate-500 mt-2">${new Date(order.createdAt).toLocaleDateString(this.i18n.currentLang() === 'ar' ? 'ar-SA' : 'en-US')}</div>
        </div>
      `;
      
      marker.bindPopup(popupContent);
      circle.bindPopup(popupContent);
    });

    // Fit map to markers
    const group = L.featureGroup(this.markers);
    this.map.fitBounds(group.getBounds().pad(0.1));
  }

  private getStatusColor(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.COMPLETED: return '#14b8a6'; // teal-500
      case OrderStatus.PENDING: return '#f59e0b';   // amber-500
      case OrderStatus.CANCELLED: return '#ef4444'; // red-500
      default: return '#64748b';                    // slate-500
    }
  }

  private getStatusText(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.COMPLETED: return this.i18n.t('buying_areas.status.completed');
      case OrderStatus.PENDING: return this.i18n.t('buying_areas.status.pending');
      case OrderStatus.CANCELLED: return this.i18n.t('buying_areas.status.cancelled');
      default: return status;
    }
  }
}
