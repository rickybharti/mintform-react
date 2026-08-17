import { useRef, useState } from "react";
import {
  Mintform,
  type MintformAppearance,
  type MintformDetail,
  type MintformDirection,
  type MintformEdge,
  type MintformHandle,
  type MintformLighting,
  type MintformMark,
  type MintformMotion,
} from "../index";
import "./MintformDemo.css";

/* These are sRGB picker fallbacks. Until a picker is changed, the demo renders
   the authored display-p3 sGHO preset without replacing its material tokens. */
const CUSTOM_MATERIAL_FALLBACK = "#00dc21";
const CUSTOM_FIELD_FALLBACK = "#978eff";
const CUSTOM_EDGE_ACCENT_FALLBACK = "#00c13a";

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

export default function MintformDemo() {
  const mintformRef = useRef<MintformHandle>(null);
  const [appearance, setAppearance] =
    useState<MintformAppearance>("sculpted");
  const [materialColor, setMaterialColor] = useState<string>();
  const [size, setSize] = useState(160);
  const [thickness, setThickness] = useState(16);
  const [detail, setDetail] = useState<MintformDetail>("high");
  const [showField, setShowField] = useState(true);
  const [fieldColor, setFieldColor] = useState(CUSTOM_FIELD_FALLBACK);
  const [fieldReach, setFieldReach] = useState(0.5);
  const [fieldCustomized, setFieldCustomized] = useState(false);
  const [edgeAccent, setEdgeAccent] = useState(CUSTOM_EDGE_ACCENT_FALLBACK);
  const [accentEvery, setAccentEvery] = useState<2 | 3 | 4 | false>(2);
  const [edgeFinish, setEdgeFinish] = useState<
    NonNullable<MintformEdge["finish"]>
  >("reeded");
  const [edgeCustomized, setEdgeCustomized] = useState(false);
  const [mark, setMark] = useState<MintformMark>({
    kind: "preset",
    name: "gho",
    scale: 1,
  });
  const [backMarkName, setBackMarkName] = useState<
    "same" | "gho" | "aave" | "none"
  >("same");
  const [shadowIntensity, setShadowIntensity] = useState(1);
  const [lighting, setLighting] = useState<MintformLighting>("reference");
  const [initialRotation, setInitialRotation] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [spinPitchArc, setSpinPitchArc] = useState(18);
  const [direction, setDirection] = useState<MintformDirection>("clockwise");
  const [turns, setTurns] = useState<1 | 2 | 3>(1);
  const [profile, setProfile] = useState<MintformMotion["profile"]>("reference");
  const [idle, setIdle] = useState<MintformMotion["idle"]>("bounce");
  const [dragEnabled, setDragEnabled] = useState(true);
  const backMark =
    backMarkName === "same"
      ? undefined
      : backMarkName === "none"
        ? { kind: "none" as const }
        : {
            kind: "preset" as const,
            name: backMarkName,
            scale: 1,
          };

  return (
    <main className="component-demo">
      <section className="component-demo__stage" aria-labelledby="demo-title">
        <p className="component-demo__eyebrow">mintform</p>
        <h1 id="demo-title">A CSS 3D token with an intentional API</h1>
        <p className="component-demo__intro">
          Tune the cap, ridges, lower colour field, mark, lighting, and motion.
          Click to spin, or drag horizontally to turn the token and vertically
          to tilt it.
        </p>

        <div className="component-demo__coin">
          <Mintform
            key={`${initialRotation}:${pitch}`}
            ref={mintformRef}
            preset="sgho"
            appearance={appearance}
            size={size}
            thickness={thickness}
            detail={detail}
            material={materialColor ? { color: materialColor } : undefined}
            lowerField={
              showField
                ? fieldCustomized
                  ? { color: fieldColor, reach: fieldReach, softness: 0.3 }
                  : undefined
                : false
            }
            edge={
              edgeCustomized
                ? {
                    accentColor: edgeAccent,
                    accentEvery,
                    finish: edgeFinish,
                  }
                : undefined
            }
            mark={mark}
            faces={backMark ? { back: { mark: backMark } } : undefined}
            shadow={{ intensity: shadowIntensity }}
            lighting={lighting}
            interaction={{ drag: dragEnabled }}
            orientation={{ pitch }}
            motion={{
              initialRotation,
              pitchArc: spinPitchArc,
              direction,
              turns,
              idle,
              profile,
            }}
            ariaLabel="Spin or drag Mintform token"
          />
        </div>

        <button
          className="mintform-demo__spin"
          type="button"
          onClick={() => mintformRef.current?.spin()}
        >
          Spin token
        </button>
      </section>

      <aside className="component-demo__controls" aria-label="Mintform controls">
        <label>
          Appearance
          <select
            value={appearance}
            onChange={(event) =>
              setAppearance(event.target.value as MintformAppearance)
            }
          >
            <option value="sculpted">Sculpted — layered bevels</option>
            <option value="clean">Clean — one plain cap</option>
          </select>
        </label>
        <label>
          Material colour
          <input
            type="color"
            value={materialColor ?? CUSTOM_MATERIAL_FALLBACK}
            onChange={(event) => setMaterialColor(event.target.value)}
          />
          <span className="component-demo__control-hint">
            The authored sGHO material is active until this is changed. Then one
            colour derives the cap, rim, highlight, shadow and primary ridge
            material.
          </span>
        </label>
        <label>
          Size <output>{size}px</output>
          <input
            type="range"
            min="48"
            max="320"
            value={size}
            onChange={(event) => {
              const nextSize = Number(event.target.value);
              setSize(nextSize);
              setThickness((current) =>
                clamp(current, Math.ceil(nextSize * 0.04), Math.floor(nextSize * 0.25)),
              );
            }}
          />
        </label>
        <label>
          Thickness <output>{thickness}px</output>
          <input
            type="range"
            min={Math.ceil(size * 0.04)}
            max={Math.floor(size * 0.25)}
            value={thickness}
            onChange={(event) => setThickness(Number(event.target.value))}
          />
        </label>
        <label>
          Detail
          <select
            value={detail}
            onChange={(event) =>
              setDetail(event.target.value as MintformDetail)
            }
          >
            <option value="low">Low — lighter adaptive mesh</option>
            <option value="medium">Medium — balanced adaptive mesh</option>
            <option value="high">High — smooth adaptive mesh</option>
          </select>
        </label>
        <label className="component-demo__field-toggle">
          <span>Show lower colour field</span>
          <input
            type="checkbox"
            checked={showField}
            onChange={(event) => setShowField(event.target.checked)}
          />
        </label>
        <label>
          Lower field colour
          <input
            type="color"
            value={fieldColor}
            disabled={!showField}
            onChange={(event) => {
              setFieldColor(event.target.value);
              setFieldCustomized(true);
            }}
          />
        </label>
        <label>
          Lower field reach <output>{Math.round(fieldReach * 100)}%</output>
          <input
            type="range"
            min="10"
            max="100"
            value={fieldReach * 100}
            disabled={!showField}
            onChange={(event) => {
              setFieldReach(Number(event.target.value) / 100);
              setFieldCustomized(true);
            }}
          />
        </label>
        <label>
          Ridge accent colour
          <input
            type="color"
            value={edgeAccent}
            onChange={(event) => {
              setEdgeAccent(event.target.value);
              setEdgeCustomized(true);
            }}
          />
        </label>
        <label>
          Accent cadence
          <select
            value={accentEvery === false ? "none" : accentEvery}
            onChange={(event) => {
              setAccentEvery(
                event.target.value === "none"
                  ? false
                  : (Number(event.target.value) as 2 | 3 | 4),
              );
              setEdgeCustomized(true);
            }}
          >
            <option value="2">Every 2nd ridge</option>
            <option value="3">Every 3rd ridge</option>
            <option value="4">Every 4th ridge</option>
            <option value="none">One ridge colour</option>
          </select>
        </label>
        <label>
          Edge finish
          <select
            value={
              edgeCustomized
                ? edgeFinish
                : appearance === "clean"
                  ? "smooth"
                  : "reeded"
            }
            onChange={(event) => {
              setEdgeFinish(
                event.target.value as NonNullable<MintformEdge["finish"]>,
              );
              setEdgeCustomized(true);
            }}
          >
            <option value="reeded">Reeded — alternate ridge bands</option>
            <option value="uniform">Uniform — one continuous ridge tone</option>
            <option value="smooth">Smooth — plain sidewall material</option>
          </select>
        </label>
        <label>
          Mark
          <select
            value={mark.kind === "preset" ? mark.name : "none"}
            onChange={(event) =>
              setMark(
                event.target.value === "none"
                  ? { kind: "none" }
                  : {
                      kind: "preset",
                      name: event.target.value as "gho" | "aave",
                      scale: 1,
                    },
              )
            }
          >
            <option value="gho">GHO</option>
            <option value="aave">Aave</option>
            <option value="none">None</option>
          </select>
        </label>
        <label>
          Back mark
          <select
            value={backMarkName}
            onChange={(event) =>
              setBackMarkName(
                event.target.value as "same" | "gho" | "aave" | "none",
              )
            }
          >
            <option value="same">Same as front</option>
            <option value="gho">GHO</option>
            <option value="aave">Aave</option>
            <option value="none">None</option>
          </select>
        </label>
        <label>
          Shadow <output>{Math.round(shadowIntensity * 100)}%</output>
          <input
            type="range"
            min="0"
            max="100"
            value={shadowIntensity * 100}
            onChange={(event) =>
              setShadowIntensity(Number(event.target.value) / 100)
            }
          />
        </label>
        <label>
          Lighting
          <select
            value={lighting}
            onChange={(event) =>
              setLighting(event.target.value as MintformLighting)
            }
          >
            <option value="reference">Reference</option>
            <option value="studio">Studio</option>
            <option value="dramatic">Dramatic</option>
          </select>
          <span className="component-demo__control-hint">
            A directional shading recipe using the existing material layers;
            it does not add lights, filters, or render passes.
          </span>
        </label>
        <label>
          Resting rotation <output>{initialRotation}°</output>
          <input
            type="range"
            min="0"
            max="180"
            value={initialRotation}
            onChange={(event) => setInitialRotation(Number(event.target.value))}
          />
        </label>
        <label>
          Camera tilt <output>{pitch}°</output>
          <input
            type="range"
            min="-42"
            max="42"
            value={pitch}
            onChange={(event) => setPitch(Number(event.target.value))}
          />
          <span className="component-demo__control-hint">
            A fixed X-axis tilt; press spin remains on the vertical Y-axis.
          </span>
        </label>
        <label>
          Spin tilt arc <output>{spinPitchArc}°</output>
          <input
            type="range"
            min="-30"
            max="30"
            value={spinPitchArc}
            onChange={(event) => setSpinPitchArc(Number(event.target.value))}
          />
          <span className="component-demo__control-hint">
            The extra pitch applied at the midpoint of each press spin. Set it
            to 0° to disable the two-axis motion.
          </span>
        </label>
        <label>
          Spin direction
          <select
            value={direction}
            onChange={(event) =>
              setDirection(event.target.value as MintformDirection)
            }
          >
            <option value="clockwise">Clockwise</option>
            <option value="counterclockwise">Counter-clockwise</option>
            <option value="alternate">Alternate</option>
          </select>
        </label>
        <label>
          Spin turns
          <select
            value={turns}
            onChange={(event) =>
              setTurns(Number(event.target.value) as 1 | 2 | 3)
            }
          >
            <option value="1">1 turn</option>
            <option value="2">2 turns</option>
            <option value="3">3 turns</option>
          </select>
        </label>
        <label>
          Spin feel
          <select
            value={profile}
            onChange={(event) =>
              setProfile(event.target.value as MintformMotion["profile"])
            }
          >
            <option value="calm">Calm</option>
            <option value="reference">Reference</option>
            <option value="brisk">Brisk</option>
            <option value="toss">Toss</option>
            <option value="showcase">Showcase</option>
          </select>
        </label>
        <label className="component-demo__field-toggle">
          <span>Idle bounce</span>
          <input
            type="checkbox"
            checked={idle === "bounce"}
            onChange={(event) =>
              setIdle(event.target.checked ? "bounce" : "none")
            }
          />
        </label>
        <label className="component-demo__field-toggle">
          <span>Drag and flick</span>
          <input
            type="checkbox"
            checked={dragEnabled}
            onChange={(event) => setDragEnabled(event.target.checked)}
          />
        </label>
      </aside>
    </main>
  );
}
