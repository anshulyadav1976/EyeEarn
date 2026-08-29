export type EvidencePosition = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
};

export type VoiceObservation = {
  id: string;
  text: string;
  capturedAt: string;
  runner: string;
  position: EvidencePosition | null;
  modality: "voice" | "fused";
  privacyState: "safe" | "derived";
  visualId?: string;
};

type VisualObservation = {
  id: string;
  category: string;
  capturedAt?: string;
  metadata?: { position?: EvidencePosition | null };
  privacyState?: string;
};

const words = (value: string) =>
  new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3),
  );

export function sanitizeVoiceText(value: string) {
  return value
    .trim()
    .replace(/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/gi, "[contact removed]")
    .replace(/\b(?:\+?\d[\d ()-]{7,}\d)\b/g, "[number removed]")
    .slice(0, 280);
}

function distanceMetres(
  a: EvidencePosition | null,
  b: EvidencePosition | null,
) {
  if (!a || !b) return Infinity;
  const radians = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * radians;
  const dLon = (b.longitude - a.longitude) * radians;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * radians) *
      Math.cos(b.latitude * radians) *
      Math.sin(dLon / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function fuseVoiceWithVisual(
  voice: VoiceObservation,
  visuals: VisualObservation[],
) {
  const voiceWords = words(voice.text);
  const match = visuals
    .map((visual) => {
      const seconds =
        Math.abs(
          new Date(voice.capturedAt).getTime() -
            new Date(visual.capturedAt ?? 0).getTime(),
        ) / 1000;
      const nearby =
        seconds <= 90 &&
        distanceMetres(voice.position, visual.metadata?.position ?? null) <=
          150;
      const compatible = [...words(visual.category)].some((word) =>
        voiceWords.has(word),
      );
      return { visual, score: nearby ? (compatible ? 2 : 1) : 0 };
    })
    .sort((a, b) => b.score - a.score)[0];
  return match && match.score > 0
    ? { ...voice, modality: "fused" as const, visualId: match.visual.id }
    : voice;
}

export function makeVoiceObservation(
  text: string,
  runner: string,
  position: EvidencePosition | null,
  capturedAt = new Date().toISOString(),
): VoiceObservation | null {
  const safeText = sanitizeVoiceText(text);
  if (!safeText) return null;
  return {
    id: `OBS-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    text: safeText,
    capturedAt,
    runner: runner.slice(0, 40),
    position,
    modality: "voice",
    privacyState: "derived",
  };
}

// ponytail: linear scan is enough for the short demo evidence ledger; index by time/location at scale.
