import { useEffect } from "react";
import { clamp, projectCoinNormal } from "../core/geometry";
import {
  type MintformLightingMode,
  pitchArcOffset,
  shadingForNormal,
} from "../core/motion";
import { applyMintformFrame, type AppliedMintformFrame } from "./frame";

type RefValue<T> = { current: T };

export type MintformAnimationState = {
  rotation: number;
  target: number;
  velocity: number;
  tilt: number;
  tiltTarget: number;
  tiltVelocity: number;
  usesPitchArc: boolean;
  pitchOrigin: number;
  pitchTarget: number;
  pitchStartOffset: number;
};

export type MintformRuntime = {
  render: () => void;
  start: () => void;
};

type UseMintformMotionOptions = {
  rootRef: RefValue<HTMLDivElement | null>;
  bodyRef: RefValue<HTMLDivElement | null>;
  frontFaceRef: RefValue<HTMLDivElement | null>;
  backFaceRef: RefValue<HTMLDivElement | null>;
  edgeShellRef: RefValue<HTMLDivElement | null>;
  shadowAngleTrackRef: RefValue<HTMLDivElement | null>;
  animationRef: RefValue<MintformAnimationState>;
  reducedMotionRef: RefValue<boolean>;
  runtimeRef: RefValue<MintformRuntime | null>;
  dragStateRef: RefValue<unknown | null>;
  motion: {
    pitchArc: number;
    springStiffness: number;
    springDamping: number;
  };
  shadow: {
    baseWidth: number;
    widthReduction: number;
  };
  pitch: number;
  lighting: MintformLightingMode;
  sizeScale: number;
};

/**
 * Owns interruptible spin, tilt, drag-settle, and orientation lighting. It
 * intentionally stops scheduling frames at rest; autonomous idle motion is a
 * CSS concern on separate transform tracks.
 */
export function useMintformMotion({
  rootRef,
  bodyRef,
  frontFaceRef,
  backFaceRef,
  edgeShellRef,
  shadowAngleTrackRef,
  animationRef,
  reducedMotionRef,
  runtimeRef,
  dragStateRef,
  motion,
  shadow,
  pitch,
  lighting,
  sizeScale,
}: UseMintformMotionOptions) {
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;

    const root = rootRef.current;
    const initialState = animationRef.current;
    if (!dragStateRef.current) {
      initialState.tilt = pitch;
      initialState.tiltTarget = pitch;
      initialState.tiltVelocity = 0;
    }

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = media.matches;
    const onPreferenceChange = (event: MediaQueryListEvent) => {
      reducedMotionRef.current = event.matches;
      if (event.matches) {
        const state = animationRef.current;
        state.rotation = state.target;
        state.velocity = 0;
        state.tilt = state.tiltTarget;
        state.tiltVelocity = 0;
        state.usesPitchArc = false;
        state.pitchOrigin = state.rotation;
        state.pitchTarget = state.rotation;
        state.pitchStartOffset = 0;
      }
      runtimeRef.current?.render();
      if (!event.matches) runtimeRef.current?.start();
    };
    media.addEventListener("change", onPreferenceChange);

    let frameId: number | null = null;
    let disposed = false;
    let lastTime = performance.now();
    let isInViewport = true;
    let previousFrame: AppliedMintformFrame = null;
    let animationActive = false;

    const canAnimate = () =>
      isInViewport && document.visibilityState === "visible";

    const setAnimationActive = (active: boolean) => {
      if (!root || animationActive === active) return;
      animationActive = active;
      root.dataset.mintformAnimating = active ? "true" : "false";
    };

    const render = (now: number) => {
      const state = animationRef.current;
      const reduced = reducedMotionRef.current;
      const deltaSeconds = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const spinning =
        Math.abs(state.target - state.rotation) >= 0.02 ||
        Math.abs(state.velocity) >= 0.02;
      const tilting =
        Math.abs(state.tiltTarget - state.tilt) >= 0.02 ||
        Math.abs(state.tiltVelocity) >= 0.02;

      if (!reduced && spinning) {
        const acceleration =
          motion.springStiffness * (state.target - state.rotation) -
          motion.springDamping * state.velocity;
        state.velocity += acceleration * deltaSeconds;
        state.rotation += state.velocity * deltaSeconds;

        if (
          Math.abs(state.target - state.rotation) < 0.02 &&
          Math.abs(state.velocity) < 0.02
        ) {
          state.rotation = state.target;
          state.velocity = 0;
        }
      }

      if (!reduced && tilting) {
        const acceleration =
          motion.springStiffness * (state.tiltTarget - state.tilt) -
          motion.springDamping * state.tiltVelocity;
        state.tiltVelocity += acceleration * deltaSeconds;
        state.tilt += state.tiltVelocity * deltaSeconds;

        if (
          Math.abs(state.tiltTarget - state.tilt) < 0.02 &&
          Math.abs(state.tiltVelocity) < 0.02
        ) {
          state.tilt = state.tiltTarget;
          state.tiltVelocity = 0;
        }
      }

      const pitchOffset =
        spinning && state.usesPitchArc
          ? pitchArcOffset(
              state.rotation,
              state.pitchOrigin,
              state.pitchTarget,
              state.pitchStartOffset,
              motion.pitchArc,
            )
          : 0;
      const animatedPitch = clamp(state.tilt + pitchOffset, -45, 45);
      const normal = projectCoinNormal(state.rotation, animatedPitch);
      const screenNormalLength = Math.hypot(normal.x, normal.y);
      const shading = shadingForNormal(normal, lighting);

      previousFrame = applyMintformFrame(
        {
          body,
          frontFace: frontFaceRef.current,
          backFace: backFaceRef.current,
          edgeShell: edgeShellRef.current,
          shadowAngleTrack: shadowAngleTrackRef.current,
        },
        {
          rotation: state.rotation,
          pitch: animatedPitch,
          shadowWidthScale:
            (shadow.baseWidth -
              shadow.widthReduction * screenNormalLength) /
            100,
          shadowX: 4 * normal.x * sizeScale,
          faceShade: shading.faceShade,
          edgeShade: shading.edgeShade,
        },
        previousFrame,
      );
    };

    const shouldContinue = () => {
      const state = animationRef.current;
      const spinning =
        Math.abs(state.target - state.rotation) >= 0.02 ||
        Math.abs(state.velocity) >= 0.02;
      const tilting =
        Math.abs(state.tiltTarget - state.tilt) >= 0.02 ||
        Math.abs(state.tiltVelocity) >= 0.02;

      return (
        canAnimate() &&
        !reducedMotionRef.current &&
        (spinning || tilting)
      );
    };

    const tick = (now: number) => {
      frameId = null;
      if (!canAnimate()) {
        setAnimationActive(false);
        return;
      }

      render(now);
      if (!disposed && shouldContinue()) {
        frameId = requestAnimationFrame(tick);
      } else {
        setAnimationActive(false);
      }
    };

    const start = () => {
      if (disposed || frameId !== null || !canAnimate()) return;
      lastTime = performance.now();
      setAnimationActive(true);
      frameId = requestAnimationFrame(tick);
    };

    const onVisibilityChange = () => {
      if (!canAnimate()) setAnimationActive(false);
      if (canAnimate() && shouldContinue()) start();
    };

    const observer =
      root && "IntersectionObserver" in window
        ? new IntersectionObserver(([entry]) => {
            isInViewport = entry.isIntersecting;
            root.dataset.mintformVisible = isInViewport ? "true" : "false";
            if (!canAnimate()) setAnimationActive(false);
            if (canAnimate() && shouldContinue()) start();
          })
        : null;
    if (root && observer) observer.observe(root);
    document.addEventListener("visibilitychange", onVisibilityChange);

    runtimeRef.current = {
      render: () => render(performance.now()),
      start,
    };
    runtimeRef.current.render();

    return () => {
      disposed = true;
      if (frameId !== null) cancelAnimationFrame(frameId);
      runtimeRef.current = null;
      media.removeEventListener("change", onPreferenceChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      observer?.disconnect();
      setAnimationActive(false);
    };
  }, [
    animationRef,
    backFaceRef,
    bodyRef,
    dragStateRef,
    edgeShellRef,
    frontFaceRef,
    lighting,
    motion,
    pitch,
    reducedMotionRef,
    rootRef,
    runtimeRef,
    shadow,
    shadowAngleTrackRef,
    sizeScale,
  ]);
}
