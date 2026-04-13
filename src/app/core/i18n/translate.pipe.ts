import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from './i18n.service';

@Pipe({
    name: 't',
    standalone: true,
    pure: false // Set to false to update when the signal changes
})
export class TranslatePipe implements PipeTransform {
    private i18n = inject(I18nService);

    transform(key: string): string {
        return this.i18n.t(key);
    }
}
