export const SHARE_CARD_IMAGE_SIZE = 215;

export type SquareCropRect = {
  x: number;
  y: number;
  size: number;
};

export function getCenteredSquareCrop(width: number, height: number): SquareCropRect {
  const safeWidth = Math.max(1, Math.floor(width));
  const safeHeight = Math.max(1, Math.floor(height));
  const size = Math.min(safeWidth, safeHeight);

  return {
    x: Math.floor((safeWidth - size) / 2),
    y: Math.floor((safeHeight - size) / 2),
    size,
  };
}
