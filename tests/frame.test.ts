import { describe, expect, it, vi } from "vitest";
import {
  applyMintformFrame,
  type MintformFrame,
  type MintformFrameElements,
} from "../src/runtime/frame";

function elementStub() {
  return {
    style: {
      transform: "",
      setProperty: vi.fn(),
    },
  } as unknown as HTMLDivElement;
}

describe("Mintform frame writer", () => {
  it("writes transforms directly and scopes inherited material inputs", () => {
    const body = elementStub();
    const frontFace = elementStub();
    const backFace = elementStub();
    const edgeShell = elementStub();
    const shadowAngleTrack = elementStub();
    const elements: MintformFrameElements = {
      body,
      frontFace,
      backFace,
      edgeShell,
      shadowAngleTrack,
    };
    const frame: MintformFrame = {
      rotation: 42,
      pitch: 12,
      shadowWidthScale: 0.5,
      shadowX: 3,
      faceShade: 0.2,
      edgeShade: 0.8,
    };

    const applied = applyMintformFrame(elements, frame, null);

    expect(body.style.transform).toBe("rotateX(12deg) rotateY(42deg)");
    expect(shadowAngleTrack.style.transform).toBe("scaleX(0.5)");
    expect(body.style.setProperty).not.toHaveBeenCalled();
    expect(frontFace.style.setProperty).toHaveBeenCalledTimes(2);
    expect(backFace.style.setProperty).toHaveBeenCalledTimes(2);
    expect(edgeShell.style.setProperty).toHaveBeenCalledWith(
      "--mintform-edge-shade",
      "0.8",
    );

    applyMintformFrame(elements, frame, applied);
    expect(frontFace.style.setProperty).toHaveBeenCalledTimes(2);
    expect(edgeShell.style.setProperty).toHaveBeenCalledTimes(1);
  });
});
