import { describe, expect, it } from "vitest";
import { getCenteredSquareCrop, SHARE_CARD_IMAGE_SIZE } from "@/lib/share-card-image";

describe("share card image helpers", () => {
  it("uses the configured 215px target size", () => {
    expect(SHARE_CARD_IMAGE_SIZE).toBe(215);
  });

  it("crops landscape images from the horizontal center", () => {
    expect(getCenteredSquareCrop(640, 360)).toEqual({
      x: 140,
      y: 0,
      size: 360,
    });
  });

  it("crops portrait images from the vertical center", () => {
    expect(getCenteredSquareCrop(360, 640)).toEqual({
      x: 0,
      y: 140,
      size: 360,
    });
  });

  it("keeps square images unchanged", () => {
    expect(getCenteredSquareCrop(215, 215)).toEqual({
      x: 0,
      y: 0,
      size: 215,
    });
  });
});
