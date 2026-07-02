import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from '../i18n/ui';

export type Trip = CollectionEntry<'trips'>;

/** Drafts show in dev and in preview builds (PUBLIC_PREVIEW=1, see
    scripts/publish-preview.sh); production builds exclude them. */
export const isPublished = (e: { data: { draft: boolean } }) =>
  import.meta.env.DEV || import.meta.env.PUBLIC_PREVIEW === '1' || !e.data.draft;

/** All published standalone trips for a language, newest first (ties broken by `order`).
    Journey segments are excluded — they surface through their journey instead. */
export async function getTripsByLocale(locale: Locale): Promise<Trip[]> {
  const trips = await getCollection(
    'trips',
    (t) => t.data.lang === locale && !t.data.journey && isPublished(t),
  );
  return trips.sort((a, b) => {
    const byDate = b.data.date.getTime() - a.data.date.getTime();
    return byDate !== 0 ? byDate : b.data.order - a.data.order;
  });
}

/** Every (locale, slug) pair — used by getStaticPaths for the flat trip route.
    Journey segments are excluded; they get nested URLs via lib/journeys.ts. */
export async function getAllTripParams() {
  const trips = await getCollection('trips', (t) => !t.data.journey && isPublished(t));
  return trips.map((trip) => ({
    params: { lang: trip.data.lang, slug: trip.data.slug },
    props: { trip },
  }));
}

/** Same trip in other languages, for the language switcher (matched by `key`). */
export async function getTripTranslations(trip: Trip): Promise<Trip[]> {
  const trips = await getCollection('trips', (t) => t.data.key === trip.data.key);
  return trips;
}
