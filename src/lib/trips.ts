import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from '../i18n/ui';

export type Trip = CollectionEntry<'trips'>;

const isPublished = (t: Trip) => import.meta.env.DEV || !t.data.draft;

/** All published trips for a language, newest first (ties broken by `order`). */
export async function getTripsByLocale(locale: Locale): Promise<Trip[]> {
  const trips = await getCollection('trips', (t) => t.data.lang === locale && isPublished(t));
  return trips.sort((a, b) => {
    const byDate = b.data.date.getTime() - a.data.date.getTime();
    return byDate !== 0 ? byDate : b.data.order - a.data.order;
  });
}

/** Every (locale, slug) pair — used by getStaticPaths for the trip route. */
export async function getAllTripParams() {
  const trips = await getCollection('trips', isPublished);
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
