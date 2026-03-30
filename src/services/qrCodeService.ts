import QRCode from 'qrcode'

export async function generateQRCode(matchId: string): Promise<string> {
  const qrCodeDataUrl = await QRCode.toDataURL(matchId)
  return qrCodeDataUrl
}
