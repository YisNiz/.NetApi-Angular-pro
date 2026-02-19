
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

import { provideHttpClient, withFetch } from '@angular/common/http';

import { providePrimeNG } from 'primeng/config';
import { ConfirmationService } from 'primeng/api'; 

import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';

import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

const MyPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{yellow.50}',
      100: '{yellow.100}',
      200: '{yellow.200}',
      300: '{yellow.300}',
      400: '{yellow.400}',
      500: '{yellow.500}',
      600: '{yellow.600}',
      700: '{yellow.700}',
      800: '{yellow.800}',
      900: '{yellow.900}',
      950: '{yellow.950}'
    }
  }
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()),
    provideAnimationsAsync(),
    provideRouter(routes),

    ConfirmationService,

    providePrimeNG({
      theme: { preset: MyPreset }
    }),

    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection()
  ]
};
