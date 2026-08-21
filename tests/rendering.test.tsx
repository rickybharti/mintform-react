import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Mintform } from "../src/Mintform";

function count(markup: string, value: string) {
  return markup.split(value).length - 1;
}

describe("Mintform appearance rendering", () => {
  it("preserves the sculpted renderer as the default", () => {
    const markup = renderToStaticMarkup(
      <Mintform interactive={false} motion={{ idle: "none" }} />,
    );

    expect(markup).toContain('data-mintform-appearance="sculpted"');
    expect(markup).toContain('data-finish="reeded"');
    expect(count(markup, "mintform__face-outer")).toBe(2);
    expect(markup).not.toContain("mintform__face-clean");
  });

  it("uses one plain cap per face and a smooth sealed sidewall in clean mode", () => {
    const markup = renderToStaticMarkup(
      <Mintform appearance="clean" interactive={false} />,
    );

    expect(markup).toContain('data-mintform-appearance="clean"');
    expect(markup).toContain('data-finish="smooth"');
    expect(count(markup, "mintform__face-clean")).toBe(2);
    expect(markup).not.toContain("mintform__face-outer");
    expect(count(markup, "mintform__edge-slice")).toBe(120);
  });

  it("keeps explicit edge treatments independent from appearance", () => {
    const markup = renderToStaticMarkup(
      <Mintform
        appearance="clean"
        edge={{ finish: "reeded", accentEvery: 3 }}
        interactive={false}
      />,
    );

    expect(markup).toContain('data-finish="reeded"');
    expect(markup).toContain('data-band="alternate"');
  });

  it("renders adaptive density while preserving an exact expert override", () => {
    const largeMarkup = renderToStaticMarkup(
      <Mintform size={320} detail="high" interactive={false} />,
    );
    const explicitMarkup = renderToStaticMarkup(
      <Mintform
        size={320}
        detail="high"
        rendering={{ edge: { segments: 64 } }}
        interactive={false}
      />,
    );

    expect(count(largeMarkup, "mintform__edge-slice")).toBe(240);
    expect(count(explicitMarkup, "mintform__edge-slice")).toBe(64);
  });

  it("scales mark artwork inside a separate fixed clipping boundary", () => {
    const markup = renderToStaticMarkup(
      <Mintform
        interactive={false}
        mark={{
          kind: "custom",
          scale: 0.5,
          render: <svg viewBox="0 0 160 160" aria-hidden="true" />,
        }}
      />,
    );
    const clipLayers = markup.match(/<div class="mintform__logo"[^>]*>/g) ?? [];
    const contentLayers =
      markup.match(/<div class="mintform__logo-content"[^>]*>/g) ?? [];

    expect(clipLayers).toHaveLength(2);
    expect(contentLayers).toHaveLength(2);
    expect(clipLayers.every((tag) => tag.includes("--mintform-logo-clip-radius"))).toBe(true);
    expect(clipLayers.every((tag) => !tag.includes("--mintform-logo-transform"))).toBe(true);
    expect(contentLayers.every((tag) => tag.includes("--mintform-logo-transform:scale(0.5)"))).toBe(true);
    expect(contentLayers.every((tag) => !tag.includes("--mintform-logo-clip-radius"))).toBe(true);
  });
});
