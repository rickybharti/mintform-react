export type MintformFrame = {
  rotation: number;
  pitch: number;
  shadowWidthScale: number;
  shadowX: number;
  faceShade: number;
  edgeShade: number;
};

export type AppliedMintformFrame = MintformFrame | null;

export type MintformFrameElements = {
  body: HTMLDivElement | null;
  frontFace: HTMLDivElement | null;
  backFace: HTMLDivElement | null;
  edgeShell: HTMLDivElement | null;
  shadowAngleTrack: HTMLDivElement | null;
};

function setProperty(
  elements: Array<HTMLElement | null>,
  property: string,
  value: string,
) {
  for (const element of elements) {
    element?.style.setProperty(property, value);
  }
}

/**
 * Applies only values that genuinely change during a turn. Every write is
 * either a transform or a material input; idle motion is owned by CSS.
 */
export function applyMintformFrame(
  elements: MintformFrameElements,
  frame: MintformFrame,
  previous: AppliedMintformFrame,
) {
  const { body } = elements;
  if (!body) return previous;

  if (
    previous === null ||
    previous.rotation !== frame.rotation ||
    previous.pitch !== frame.pitch
  ) {
    body.style.transform = `rotateX(${frame.pitch}deg) rotateY(${frame.rotation}deg)`;
  }

  if (previous === null || previous.shadowX !== frame.shadowX) {
    setProperty(
      [elements.frontFace, elements.backFace],
      "--mintform-shadow-x",
      `${frame.shadowX}px`,
    );
  }
  if (previous === null || previous.faceShade !== frame.faceShade) {
    setProperty(
      [elements.frontFace, elements.backFace],
      "--mintform-face-shade",
      `${frame.faceShade}`,
    );
  }
  if (previous === null || previous.edgeShade !== frame.edgeShade) {
    elements.edgeShell?.style.setProperty(
      "--mintform-edge-shade",
      `${frame.edgeShade}`,
    );
  }

  if (
    elements.shadowAngleTrack &&
    (previous === null ||
      previous.shadowWidthScale !== frame.shadowWidthScale)
  ) {
    elements.shadowAngleTrack.style.transform = `scaleX(${frame.shadowWidthScale})`;
  }

  return frame;
}
