import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
    standalone: true,
    selector: 'app-top-states-widget',
    imports: [CommonModule, TranslatePipe],
    template: `
    <div class="card shadow-md border-t-4 border-t-cyan-500 border-surface-100 dark:border-surface-800 rounded-3xl p-6 bg-white dark:bg-surface-900 font-tajawal h-full flex flex-col transition-all hover:shadow-lg">
        <div class="flex justify-between items-center mb-6">
            <div>
                <div class="font-black text-lg text-surface-900 dark:text-surface-0 mb-1">{{ 'dashboard.top_states.title' | t }}</div>
                <p class="text-surface-400 dark:text-surface-500 text-[10px] font-bold uppercase tracking-widest">{{ 'dashboard.top_states.subtitle' | t }}</p>
            </div>
            <div class="w-10 h-10 bg-cyan-500/5 dark:bg-cyan-500/10 text-cyan-500 rounded-xl flex items-center justify-center border border-cyan-500/10">
                <i class="pi pi-map-marker text-xl"></i>
            </div>
        </div>

        <div class="flex-1">
            <ul class="list-none p-0 m-0">
                <li *ngFor="let state of topStates(); let i = index" class="mb-4 last:mb-0">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ state.name }}</span>
                        <span class="text-xs font-black text-primary">{{ state.count }}</span>
                    </div>
                    <div class="w-full bg-surface-50 dark:bg-surface-800 rounded-full h-1.5 border border-surface-100 dark:border-surface-700">
                        <div class="bg-primary h-full rounded-full transition-all duration-1000" 
                             [style.width.%]="(state.count / maxCount()) * 100">
                        </div>
                    </div>
                </li>
            </ul>

            <div *ngIf="topStates().length === 0" class="py-10 text-center opacity-50 text-surface-400 dark:text-surface-500">
                <i class="pi pi-inbox text-4xl mb-2"></i>
                <p class="text-xs">{{ 'ui.no_data' | t }}</p>
            </div>
        </div>
    </div>`
})
export class TopStatesWidget {
    // This could be passed from the parent or computed from data
    // For now we'll take a simple input
    data = input.required<any[]>();

    topStates = computed(() => {
        // Assume data is an array of objects with state names
        // In a real scenario, this would come from the API
        // For demonstration, let's take some static data or the top 5 from input
        return this.data().slice(0, 5);
    });

    maxCount = computed(() => {
        const states = this.topStates();
        if (states.length === 0) return 0;
        return Math.max(...states.map(s => s.count));
    });
}
