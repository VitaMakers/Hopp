// Turns the share links people paste into embeddable player URLs.
// Returns null for anything we don't recognise, so the viewer can skip it.

export function youtubeEmbedUrl(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\./, "");
  let id: string | null = null;
  if (host === "youtu.be") {
    id = url.pathname.slice(1).split("/")[0];
  } else if (host === "youtube.com" || host === "music.youtube.com") {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else {
      const match = url.pathname.match(/^\/(embed|shorts|live)\/([^/]+)/);
      if (match) id = match[2];
    }
  }
  if (!id || !/^[\w-]{6,20}$/.test(id)) return null;
  return `https://www.youtube-nocookie.com/embed/${id}`;
}

const SPOTIFY_KINDS = ["track", "album", "playlist", "artist", "episode", "show"];

export function spotifyEmbedUrl(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.hostname !== "open.spotify.com") return null;
  // Paths may carry a locale prefix such as /intl-pt/track/<id>.
  const parts = url.pathname.split("/").filter(Boolean);
  const kindIndex = parts.findIndex((part) => SPOTIFY_KINDS.includes(part));
  if (kindIndex === -1) return null;
  const id = parts[kindIndex + 1];
  if (!id || !/^[A-Za-z0-9]{10,40}$/.test(id)) return null;
  return `https://open.spotify.com/embed/${parts[kindIndex]}/${id}`;
}
