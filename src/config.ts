function readPort(): number {
  const p = process.env.PORT
  return p ? Number(p) : 3030
}

export const config = {
  get port(): number {
    return readPort()
  },
  talocodeBaseUrl: process.env.TALOCODE_BASE_URL || 'https://api.talocode.site',
  get allowLocalUnauth(): boolean {
    return process.env.GEOLANE_ALLOW_LOCAL_UNAUTH === 'true'
  },
}
