import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Mintform, type MintformHandle } from "../index";
import "./demo.css";
import "./performance.css";

const SAMPLE_DURATION_MS = 6_000;
const SPIN_INTERVAL_MS = 900;
const COHORTS = [1, 4, 12] as const;
const query = new URLSearchParams(window.location.search);
const detail = query.get("detail") === "medium" ? "medium" : "high";
const lowerFieldEnabled = query.get("field") !== "0";

type Measurement = {
  count: number;
  frames: number;
  meanFrameMs: number;
  p95FrameMs: number;
  worstFrameMs: number;
  estimatedFps: number;
  delayedFrames: number;
  longTasks: number;
  longTaskMs: number;
};

function percentile(samples: number[], value: number) {
  if (samples.length === 0) return 0;
  const index = Math.min(
    samples.length - 1,
    Math.ceil(samples.length * value) - 1,
  );
  return samples[index] ?? 0;
}

function PerformanceHarness() {
  const handles = useRef<Array<MintformHandle | null>>([]);
  const [count, setCount] = useState<(typeof COHORTS)[number]>(1);
  const [run, setRun] = useState(0);
  const [result, setResult] = useState<Measurement | null>(null);
  const [status, setStatus] = useState("Choose a cohort to measure.");

  useEffect(() => {
    if (run === 0) return;

    let frameId: number | null = null;
    let cancelled = false;
    let previousTime: number | null = null;
    let longTasks = 0;
    let longTaskMs = 0;
    const frameDeltas: number[] = [];
    const startedAt = performance.now();
    let lastSpinAt = startedAt;
    const supportsLongTask =
      typeof PerformanceObserver !== "undefined" &&
      PerformanceObserver.supportedEntryTypes?.includes("longtask");
    const observer = supportsLongTask
      ? new PerformanceObserver((entries) => {
          for (const entry of entries.getEntries()) {
            longTasks += 1;
            longTaskMs += entry.duration;
          }
        })
      : null;

    observer?.observe({ type: "longtask" });
    setStatus(`Measuring ${count} high-detail coin${count === 1 ? "" : "s"}…`);
    handles.current.forEach((handle) => {
      handle?.spin({ turns: 2 });
    });

    const finish = () => {
      observer?.disconnect();
      const sorted = [...frameDeltas].sort((left, right) => left - right);
      const totalFrameMs = frameDeltas.reduce(
        (total, delta) => total + delta,
        0,
      );
      const meanFrameMs =
        frameDeltas.length > 0 ? totalFrameMs / frameDeltas.length : 0;
      const measurement: Measurement = {
        count,
        frames: frameDeltas.length,
        meanFrameMs,
        p95FrameMs: percentile(sorted, 0.95),
        worstFrameMs: sorted.at(-1) ?? 0,
        estimatedFps: meanFrameMs > 0 ? 1000 / meanFrameMs : 0,
        delayedFrames: frameDeltas.filter((delta) => delta > 20).length,
        longTasks,
        longTaskMs,
      };
      setResult(measurement);
      setStatus("Finished. Results below use the browser’s animation frames.");
    };

    const measure = (now: number) => {
      if (cancelled) return;
      if (previousTime !== null) frameDeltas.push(now - previousTime);
      previousTime = now;

      if (now - lastSpinAt >= SPIN_INTERVAL_MS) {
        handles.current.forEach((handle) => {
          handle?.spin({ turns: 2 });
        });
        lastSpinAt = now;
      }

      if (now - startedAt < SAMPLE_DURATION_MS) {
        frameId = requestAnimationFrame(measure);
      } else {
        finish();
      }
    };

    frameId = requestAnimationFrame(measure);
    return () => {
      cancelled = true;
      if (frameId !== null) cancelAnimationFrame(frameId);
      observer?.disconnect();
    };
  }, [count, run]);

  const start = (nextCount: (typeof COHORTS)[number]) => {
    handles.current = [];
    setCount(nextCount);
    setResult(null);
    setRun((current) => current + 1);
  };

  return (
    <main className="performance-harness">
      <section className="performance-harness__intro" aria-labelledby="title">
        <p className="component-demo__eyebrow">mintform benchmark</p>
        <h1 id="title">Frame pacing under real coin motion</h1>
        <p>
          Each run renders {detail}-detail tokens (
          {detail === "high" ? 120 : 80} ridge panels)
          {lowerFieldEnabled
            ? " with the lower field"
            : " without the lower field"}
          , an 18° pitch arc, and repeated two-turn spins for six seconds. This
          is a browser frame-pacing measurement, not a synthetic component
          render benchmark.
        </p>
        <div className="performance-harness__actions">
          {COHORTS.map((cohort) => (
            <button
              key={cohort}
              type="button"
              onClick={() => start(cohort)}
              disabled={status.startsWith("Measuring")}
            >
              Run {cohort} {detail}-detail coin{cohort === 1 ? "" : "s"}
            </button>
          ))}
        </div>
        <p className="performance-harness__status" aria-live="polite">
          {status}
        </p>

        {result && (
          <dl
            className="performance-harness__results"
            aria-label="Performance result"
          >
            <div>
              <dt>Frames sampled</dt>
              <dd>{result.frames}</dd>
            </div>
            <div>
              <dt>Estimated FPS</dt>
              <dd>{result.estimatedFps.toFixed(1)}</dd>
            </div>
            <div>
              <dt>Mean frame</dt>
              <dd>{result.meanFrameMs.toFixed(2)} ms</dd>
            </div>
            <div>
              <dt>95th percentile</dt>
              <dd>{result.p95FrameMs.toFixed(2)} ms</dd>
            </div>
            <div>
              <dt>Worst frame</dt>
              <dd>{result.worstFrameMs.toFixed(2)} ms</dd>
            </div>
            <div>
              <dt>Frames over 20 ms</dt>
              <dd>{result.delayedFrames}</dd>
            </div>
            <div>
              <dt>Long tasks (≥50 ms)</dt>
              <dd>{result.longTasks}</dd>
            </div>
            <div>
              <dt>Long-task time</dt>
              <dd>{result.longTaskMs.toFixed(2)} ms</dd>
            </div>
          </dl>
        )}
      </section>

      <section
        className="performance-harness__coins"
        aria-label="Measured coins"
      >
        {Array.from(
          { length: count },
          (_, index) => `coin-${run}-${index + 1}`,
        ).map((coinId, index) => (
          <Mintform
            key={coinId}
            ref={(handle) => {
              handles.current[index] = handle;
            }}
            size={160}
            thickness={16}
            detail={detail}
            material={{ color: "#4dd93d" }}
            lowerField={
              lowerFieldEnabled
                ? { color: "#978eff", reach: 0.5, softness: 0.3 }
                : false
            }
            edge={{ accentColor: "#43ad52", accentEvery: 2, finish: "reeded" }}
            orientation={{ pitch: 12 }}
            motion={{ idle: "none", pitchArc: 18, profile: "brisk" }}
            interactive={false}
          />
        ))}
      </section>
    </main>
  );
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Performance harness root element is missing.");
}

createRoot(rootElement).render(
  <StrictMode>
    <PerformanceHarness />
  </StrictMode>,
);
