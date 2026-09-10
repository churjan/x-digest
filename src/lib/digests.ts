import { getCollection, type CollectionEntry } from 'astro:content';
import { DATE_ID } from './site';

export type Digest = CollectionEntry<'digests'>;

export async function getDigests(): Promise<Digest[]> {
  const entries = await getCollection('digests');
  return entries
    .filter((entry) => DATE_ID.test(entry.id))
    .sort((a, b) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));
}

export async function getLatestDigest(): Promise<Digest | undefined> {
  const digests = await getDigests();
  return digests[0];
}

export function neighbors(digests: Digest[], id: string) {
  const index = digests.findIndex((entry) => entry.id === id);
  return {
    newer: index > 0 ? digests[index - 1] : undefined,
    older: index >= 0 && index < digests.length - 1 ? digests[index + 1] : undefined,
  };
}
