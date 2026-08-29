# Phase 4 demo path

The Explorer keeps camera capture sampled (one compressed JPEG every three seconds) and never records continuous audio. During a live run, hold **Hold to speak** to create a short observation. The browser Speech Recognition API is the zero-config fallback; typed notes are available when speech recognition is unavailable.

Set `ELEVENLABS_API_KEY` in the server environment to enable the `/api/voice-token` Realtime Scribe single-use token handshake. The hackathon UI currently uses browser Speech Recognition or typed notes for the actual transcript, and labels the Scribe token as available rather than claiming Scribe transcribed the note. Notes are trimmed to 280 characters, timestamped, attached to the current runner and GPS snapshot, and scrubbed for email/phone-shaped strings.

Voice notes within 90 seconds and 150 metres of a compatible visual category are labelled `fused`; otherwise they remain `voice-only`. Visual results marked `blocked` stay held for privacy review. Only `safe`/derived structured status is suitable for a buyer surface; raw microphone audio and continuous video are not persisted.
