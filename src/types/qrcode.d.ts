declare module "qrcode" {
  type QrCodeOptions = {
    type?: "svg" | "utf8";
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  };

  const QRCode: {
    toString(text: string, options?: QrCodeOptions): Promise<string>;
  };

  export default QRCode;
}
