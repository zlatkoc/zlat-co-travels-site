/** Prefix an internal absolute path with the configured base.
    Normal builds have base "/" so this is a no-op; preview builds
    (scripts/publish-preview.sh) live under /preview-<token>/ and every
    internal link must carry that prefix or it escapes the preview. */
export const withBase = (path: string): string =>
  import.meta.env.BASE_URL.replace(/\/$/, '') + path;
