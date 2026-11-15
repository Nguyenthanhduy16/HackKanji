# Authoring a YouTube lesson

The dictation and shadowing players share a transport for `AUDIO` and `YOUTUBE`. The shipped 30 lessons remain original audio lessons. No reference-site video or transcript was imported. The official YouTube IFrame API sample `M7lc1UVf-VE` is used only in test diagnostics, never presented as Japanese learning material.

Add an authored, licensed entry to `lessons` in `src/lib/lessons.ts` using the same `Lesson` type:

```ts
{
  // Use the title, script, thumbnail, category and level for your own content.
  source: 'YOUTUBE',
  youtubeId: 'VIDEO_ID_11',
  sentences: [
    {
      // Keep the existing sentence fields (id/text/reading/translation/words).
      startSec: 10,
      endSec: 14,
      duration: 4,
      audio: '/lessons/audio/your-original-fallback.mp3'
    }
  ]
}
```

The example is a field sketch, not a runnable lesson; replace the placeholder with an actual 11-character video ID and the full authored fields. Every sentence needs finite explicit bounds with `endSec > startSec >= 0`. The player cues without autoplay, seeks within the active range, pauses at the end, and supports a loop toggle. The iframe stays visible while playing. Source errors use a supplied local audio fallback; no transcription or pronunciation score is fabricated.

The Prisma seed mapper preserves `youtubeId` and absolute sentence start/end times. The frontend currently loads its authored catalog from `src/lib/lessons.ts`; adding database rows alone does not add frontend cards. After editing the source catalog, rebuild and run the seed if the database catalog is used.

Verification:

```sh
npm run qa:youtube
node --import tsx --test tests/lesson-seed.test.ts
```

`qa/youtube.json` separates fake-iframe protocol checks from the actual public API/embed diagnostic. The real check verified API initialization, no autoplay, clip-end pause and replay. YouTube availability, embedding permission, login/age restrictions and network conditions remain controlled by YouTube and the video publisher.
