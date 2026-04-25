import { Injectable, signal, computed, effect } from '@angular/core';
import { safeGetItem, safeSetItem } from '../utils/storage.utils';
import { ar } from './ar';
import { en } from './en';

export type Lang = 'ar' | 'en';

@Injectable({
    providedIn: 'root'
})
export class I18nService {
    private readonly STORAGE_KEY = 'app_lang';
    
    // Signal for current language
    currentLang = signal<Lang>((safeGetItem(this.STORAGE_KEY) as Lang) || 'ar');

    // Computed signals
    isRTL = computed(() => this.currentLang() === 'ar');
    direction = computed(() => this.isRTL() ? 'rtl' : 'ltr');
    
    private translations: any = { ar, en };

    constructor() {
        // Automatically apply direction and lang to HTML tag
        effect(() => {
            const lang = this.currentLang();
            const dir = this.direction();
            
            document.documentElement.lang = lang;
            document.documentElement.dir = dir;
            
            // Apply font family based on language
            if (lang === 'ar') {
                document.body.style.fontFamily = "'Tajawal', sans-serif";
            } else {
                document.body.style.fontFamily = "'Inter', sans-serif";
            }

            safeSetItem(this.STORAGE_KEY, lang);
        });
    }

    /**
     * Translate a key
     * @param key Translation key (e.g., 'menu.dashboard')
     * @returns Translated string or the key itself if not found
     */
    t(key: string): string {
        const lang = this.currentLang();
        return this.translations[lang][key] || key;
    }

    /**
     * Toggle between Arabic and English
     */
    toggleLang() {
        this.currentLang.set(this.currentLang() === 'ar' ? 'en' : 'ar');
    }

    /**
     * Set a specific language
     */
    setLang(lang: Lang) {
        this.currentLang.set(lang);
    }
}
