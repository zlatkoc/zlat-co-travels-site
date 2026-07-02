/* UI chrome strings per locale. Trip *content* lives in MDX; this is just the
   surrounding furniture (nav, labels, footer). */
export const locales = ['en', 'sl'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  sl: 'Slovenščina',
};

export const ui = {
  en: {
    'site.title': 'Travels',
    'site.tagline': 'The long way around.',
    'index.heading': 'Travels',
    'index.intro': 'Field notes from the long way around.',
    'trip.back': 'All trips',
    'trip.readMore': 'Read the trip',
    'hud.day': 'Day',
    'footer.next': 'Next trip',
    'journey.part': 'Part {n} of {m}',
    'journey.parts': 'parts',
    'journey.back': 'Back to the journey',
    'journey.prev': 'Previous part',
    'journey.next': 'Next part',
    'sound.on': 'Sound on',
    'sound.off': 'Sound off',
  },
  sl: {
    'site.title': 'Popotovanja',
    'site.tagline': 'Po daljši poti.',
    'index.heading': 'Popotovanja',
    'index.intro': 'Zapiski s poti — po daljši poti naokrog.',
    'trip.back': 'Vsa popotovanja',
    'trip.readMore': 'Preberi popotovanje',
    'hud.day': 'Dan',
    'footer.next': 'Naslednje popotovanje',
    'journey.part': '{n}. del od {m}',
    'journey.parts': 'deli',
    'journey.back': 'Nazaj na popotovanje',
    'journey.prev': 'Prejšnji del',
    'journey.next': 'Naslednji del',
    'sound.on': 'Zvok vklopljen',
    'sound.off': 'Zvok izklopljen',
  },
} as const;

export type UIKey = keyof (typeof ui)['en'];

export function t(locale: Locale, key: UIKey): string {
  return ui[locale][key] ?? ui[defaultLocale][key];
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
