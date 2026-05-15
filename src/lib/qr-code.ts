import QRCode from "qrcode";

const QR_CODE_SIZE = 320;

export async function createQrCodeSvg(content: string): Promise<string> {
  const normalizedContent = content.trim();

  if (!normalizedContent) {
    throw new Error("QR code content is required.");
  }

  return QRCode.toString(normalizedContent, {
    type: "svg",
    width: QR_CODE_SIZE,
    margin: 1,
    color: {
      dark: "#111827",
      light: "#FFFFFF",
    },
  });
}
