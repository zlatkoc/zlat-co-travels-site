import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from '../i18n/ui';
import { isPublished, type Trip } from './trips';

export type Journey = CollectionEntry<'journeys'>;

/** All published journeys for a language, newest first (ties broken by `order`). */
export async function getJourneysByLocale(locale: Locale): Promise<Journey[]> {
  const journeys = await getCollection(
    'journeys',
    (j) => j.data.lang === locale && isPublished(j),
  );
  return journeys.sort((a, b) => {
    const byDate = b.data.dateStart.getTime() - a.data.dateStart.getTime();
    return byDate !== 0 ? byDate : b.data.order - a.data.order;
  });
}

/** Published segments of a journey (same language), in reading order (`journey.part`). */
export async function getJourneySegments(journey: Journey): Promise<Trip[]> {
  const segments = await getCollection(
    'trips',
    (t) =>
      t.data.lang === journey.data.lang &&
      t.data.journey?.key === journey.data.key &&
      isPublished(t),
  );
  return segments.sort((a, b) => a.data.journey!.part - b.data.journey!.part);
}

/** Same journey in other languages, for the language switcher (matched by `key`). */
export async function getJourneyTranslations(journey: Journey): Promise<Journey[]> {
  return getCollection('journeys', (j) => j.data.key === journey.data.key);
}

/** Every (locale, journey) pair — used by getStaticPaths for the journey landing route. */
export async function getAllJourneyParams() {
  const journeys = await getCollection('journeys', isPublished);

  // A journey slug that equals a standalone trip slug in the same language would
  // produce two pages for one URL; fail loudly instead of letting Astro pick one.
  const trips = await getCollection('trips', (t) => !t.data.journey && isPublished(t));
  for (const j of journeys) {
    const clash = trips.find((t) => t.data.lang === j.data.lang && t.data.slug === j.data.slug);
    if (clash) {
      throw new Error(
        `Journey "${j.id}" and trip "${clash.id}" share the URL /${j.data.lang}/${j.data.slug}/ — rename one slug.`,
      );
    }
  }

  return journeys.map((journey) => ({
    params: { lang: journey.data.lang, journey: journey.data.slug },
    props: { journey },
  }));
}

/** Every (locale, journey, slug) triple for the segment route, with prev/next precomputed. */
export async function getAllSegmentParams() {
  const journeys = await getCollection('journeys', isPublished);

  // A published segment whose journey entry is missing (in its language) has no URL —
  // that's an authoring error, not something to skip silently.
  const orphans = await getCollection(
    'trips',
    (t) =>
      !!t.data.journey &&
      isPublished(t) &&
      !journeys.some((j) => j.data.key === t.data.journey!.key && j.data.lang === t.data.lang),
  );
  if (orphans.length > 0) {
    const ids = orphans.map((t) => `"${t.id}" (journey key: ${t.data.journey!.key})`).join(', ');
    throw new Error(`Trips reference a journey with no matching entry in their language: ${ids}`);
  }

  const params: {
    params: { lang: Locale; journey: string; slug: string };
    props: {
      trip: Trip;
      journey: Journey;
      prev: Trip | null;
      next: Trip | null;
      part: number;
      total: number;
    };
  }[] = [];
  for (const journey of journeys) {
    const segments = await getJourneySegments(journey);
    segments.forEach((trip, i) => {
      params.push({
        params: {
          lang: journey.data.lang,
          journey: journey.data.slug,
          slug: trip.data.slug,
        },
        props: {
          trip,
          journey,
          prev: segments[i - 1] ?? null,
          next: segments[i + 1] ?? null,
          part: i + 1,
          total: segments.length,
        },
      });
    });
  }
  return params;
}

/** hreflang alternates for a segment page. Only languages where both the trip
    translation and its journey entry exist get a URL. */
export async function getSegmentAlternates(
  trip: Trip,
): Promise<{ lang: Locale; href: string }[]> {
  const translations = await getCollection('trips', (t) => t.data.key === trip.data.key);
  const alternates: { lang: Locale; href: string }[] = [];
  for (const t of translations) {
    if (!t.data.journey) continue;
    const [journey] = await getCollection(
      'journeys',
      (j) => j.data.key === t.data.journey!.key && j.data.lang === t.data.lang,
    );
    if (!journey) continue;
    alternates.push({
      lang: t.data.lang,
      href: `/${t.data.lang}/${journey.data.slug}/${t.data.slug}/`,
    });
  }
  return alternates;
}
