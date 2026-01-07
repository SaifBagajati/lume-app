import { authenticator } from "otplib";
import QRCode from "qrcode";

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  uri: string;
}

export async function generateTwoFactorSecret(
  email: string,
  appName: string = "Lume"
): Promise<TwoFactorSetup> {
  const secret = authenticator.generateSecret();
  const uri = authenticator.keyuri(email, appName, secret);
  const qrCodeUrl = await QRCode.toDataURL(uri);

  return {
    secret,
    qrCodeUrl,
    uri,
  };
}

export function verifyTwoFactorToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
}

export function generateTwoFactorToken(secret: string): string {
  return authenticator.generate(secret);
}
