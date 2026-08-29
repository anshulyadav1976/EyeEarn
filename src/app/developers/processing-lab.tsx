import Image from "next/image";
import styles from "./developers.module.css";

const stages = [
  ["01", "Capture", "Video + field sensors"],
  ["02", "Sample", "Three-frame burst"],
  ["03", "Protect", "Identity masks + PII scrub"],
  ["04", "Understand", "Objects + street conditions"],
  ["05", "Voice enrichment", "ElevenLabs transcript"],
  ["06", "Multimodal fusion", "One grounded observation"],
  ["07", "Publish", "Bounded public evidence"],
] as const;

const frames = [
  {
    src: "/evidence-lab/frame-01-street.jpg",
    alt: "Street scene with vehicles, cyclist and traffic light detections",
    number: "FRAME 01",
    time: "T+00.0",
    signal: "12 objects · daylight",
    width: 800,
    height: 400,
  },
  {
    src: "/evidence-lab/frame-02-crossing.jpg",
    alt: "Crossing scene with people, vehicles, dog and traffic lights detected",
    number: "FRAME 02",
    time: "T+00.5",
    signal: "Crossing active · 4 people",
    width: 1200,
    height: 842,
  },
  {
    src: "/evidence-lab/frame-03-urban.jpg",
    alt: "Urban road scene with traffic lights, cars, bus and pedestrian detections",
    number: "FRAME 03",
    time: "T+01.0",
    signal: "Signal visible · low occlusion",
    width: 1080,
    height: 720,
  },
] as const;

const sensors = [
  ["GPS", "51.5416, −0.0032", "± 4 m"],
  ["Movement", "Walking · 1.34 m/s", "steady"],
  ["Device", "Phone · rear wide", "1080p"],
  ["Brightness", "66%", "daylight"],
  ["Sound", "71 dBA", "traffic"],
] as const;

const models = [
  ["YOLOv8", "Street-object detection"],
  ["Grounding DINO", "Open-vocabulary detection"],
  ["SAM 2", "Segmentation + privacy masks"],
  ["DPT", "Depth and scene geometry"],
  ["Luna", "Temporal multimodal synthesis"],
  ["ElevenLabs Scribe", "Voice-enrichment integration"],
] as const;

const matrix = [
  ["Environment", "Light · visibility · weather · surface · congestion"],
  ["Objects", "Signals · signs · barriers · vehicles · street furniture"],
  ["Accessibility", "Ramps · entrances · pavement width · obstructions"],
  ["Movement", "Route · pace · direction · distance · dwell time"],
  ["Device", "Camera · orientation · resolution · sensor availability"],
  ["Audio", "Sound level · transcript · spoken field observation"],
  ["Quality", "Blur · darkness · occlusion · GPS accuracy · confidence"],
  ["Privacy", "Face risk · plate risk · PII scrub · publish eligibility"],
] as const;

export default function ProcessingLab() {
  return (
    <section className={styles.lab} aria-labelledby="processing-lab-title">
      <header className={styles.labIntro}>
        <div>
          <p>EyeEarn evidence engine · trace 048A</p>
          <h2 id="processing-lab-title">
            What Cars Can&apos;t Capture:
            <br />
            One Recording For
            <br />
            <em>Ultra Enriched Data</em>
          </h2>
        </div>
        <div className={styles.labIntroCopy}>
          <p>
            EyeEarn records a short video and pairs it with everything the
            phone knows at that moment: GPS location, movement, camera and
            device details, light levels, local sound volume and the runner’s
            spoken field notes.
          </p>
          <p>
            Image-recognition models analyse what is visible, while a
            multimodal language model connects it with what was heard and
            measured. If the video is blurred or partly blocked, GPS, motion
            and the ElevenLabs-enriched voice note preserve the missing
            context.
          </p>
          <p>
            The result is a <strong>time series for each place</strong>: a
            human-readable record of accessible routes, crowd movement, noise,
            day and night conditions, temporary obstacles and how the street
            changes over time. Buyers receive that useful record—not continuous
            footage or people’s identities.
          </p>
        </div>
      </header>

      <ol className={styles.pipeline} aria-label="Evidence processing stages">
        {stages.map(([number, title, detail]) => (
          <li key={title}>
            <span>{number}</span>
            <strong>{title}</strong>
            <small>{detail}</small>
          </li>
        ))}
      </ol>

      <div className={styles.captureDesk}>
        <div className={styles.frameBurst}>
          <div className={styles.sectionLabel}>
            <span>Input 01</span>
            <b>Three-frame temporal burst</b>
            <small>1.0 second window</small>
          </div>
          <div className={styles.frames}>
            {frames.map((frame) => (
              <figure key={frame.number}>
                <div className={styles.frameImage}>
                  <Image
                    src={frame.src}
                    alt={frame.alt}
                    width={frame.width}
                    height={frame.height}
                    sizes="(max-width: 760px) 88vw, 26vw"
                  />
                  <i>TRANSIENT INPUT</i>
                </div>
                <figcaption>
                  <b>{frame.number}</b>
                  <span>{frame.time}</span>
                  <small>{frame.signal}</small>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        <aside className={styles.sensorRack}>
          <div className={styles.sectionLabel}>
            <span>Input 02</span>
            <b>Field sensor packet</b>
            <small>Synced to capture</small>
          </div>
          <dl>
            {sensors.map(([label, value, meta]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
                <small>{meta}</small>
              </div>
            ))}
          </dl>
          <blockquote>
            <span>VOICE OBSERVATION · ELEVENLABS ENRICHMENT INTEGRATION</span>
            “West entrance is open, but temporary barriers narrow the crossing.”
          </blockquote>
        </aside>
      </div>

      <div className={styles.fusionDesk}>
        <article className={styles.modelVision}>
          <div className={styles.sectionLabel}>
            <span>Recognition stack</span>
            <b>Geometry before inference</b>
            <small>Vision + language + depth</small>
          </div>
          <div className={styles.modelImage}>
            <Image
              src="/evidence-lab/model-stack.jpg"
              alt="Street scene segmented into objects and people"
              width={750}
              height={375}
              sizes="(max-width: 760px) 92vw, 48vw"
            />
            <span>OBJECTS 34 · PEOPLE MASKED · SCENE STABLE</span>
          </div>
          <div className={styles.models}>
            {models.map(([name, role]) => (
              <div key={name}>
                <b>{name}</b>
                <span>{role}</span>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.evidenceOutput}>
          <div className={styles.outputHead}>
            <span>Example · extracted evidence record</span>
            <b>STRUCTURED OUTPUT</b>
          </div>
          <p className={styles.outputKicker}>ACCESSIBILITY · CROSSING</p>
          <div className={styles.outputFinding}>
            <span>What EyeEarn found</span>
            <p>
              The west entrance is open. Temporary barriers reduce the usable
              width of the pedestrian approach.
            </p>
          </div>
          <div className={styles.outputFinding}>
            <span>Why it matters</span>
            <p>
              The route remains accessible, but wheelchair users and people
              with pushchairs may need extra passing space when the area is
              busy.
            </p>
          </div>
          <dl className={styles.outputGrid}>
            <div>
              <dt>Location</dt>
              <dd>Stratford, London</dd>
            </div>
            <div>
              <dt>Captured</dt>
              <dd>14:32:08 BST</dd>
            </div>
            <div>
              <dt>Confidence</dt>
              <dd>92%</dd>
            </div>
            <div>
              <dt>Modalities</dt>
              <dd>Vision · voice · GPS</dd>
            </div>
            <div>
              <dt>Capture quality</dt>
              <dd>High · low occlusion</dd>
            </div>
            <div>
              <dt>Privacy status</dt>
              <dd>Identity removed</dd>
            </div>
          </dl>
          <footer>
            <span>OBS-048A-7F2</span>
            <b>✓ PUBLISH ELIGIBLE</b>
          </footer>
        </article>
      </div>

      <div className={styles.matrixSection}>
        <div className={styles.matrixIntro}>
          <p>Eight evidence dimensions</p>
          <h3>One walk. A richer street record.</h3>
        </div>
        <div className={styles.matrix}>
          {matrix.map(([name, values], index) => (
            <article key={name}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <b>{name}</b>
              <p>{values}</p>
            </article>
          ))}
        </div>
      </div>

      <div className={styles.privacyBoundary}>
        <div className={styles.boundaryHeading}>
          <span>Privacy boundary</span>
          <h3>Process deeply. Publish narrowly.</h3>
          <p>
            High-resolution context exists only inside the controlled
            processing window. Every outward-facing record is reduced to the
            smallest useful evidence payload.
          </p>
        </div>
        <div className={styles.boundaryColumn}>
          <span>Processed temporarily</span>
          <ul>
            <li>Three-frame visual bursts</li>
            <li>Relevant speech window</li>
            <li>Precise GPS + sensor packet</li>
            <li>Face, plate and PII masks</li>
          </ul>
        </div>
        <div className={styles.boundaryArrow} aria-hidden="true">
          →
        </div>
        <div className={styles.boundaryColumn}>
          <span>Public evidence surface</span>
          <ul>
            <li>Derived observation + category</li>
            <li>Bounded location + freshness</li>
            <li>Confidence + provenance</li>
            <li>Modality + privacy status</li>
          </ul>
        </div>
        <strong className={styles.neverPublic}>
          NEVER PUBLIC · CONTINUOUS VIDEO · RAW AUDIO · FACE OR PLATE PIXELS ·
          DIRECT IDENTITY
        </strong>
      </div>
    </section>
  );
}
