import jwt from 'jsonwebtoken'

interface JwtClaims {
  iss: string
  scope: string
  aud: string
  exp: number
  iat: number
  sub?: string
}

export async function getServiceAccountAccessToken(options: {
  scopes: string[]
  subjectEmail?: string
}): Promise<string> {
  const clientEmail = process.env.GOOGLE_SA_EMAIL || ''
  const privateKey = (process.env.GOOGLE_SA_PRIVATE_KEY || '').replace(/\\n/g, '\n')
  const tokenUrl = 'https://oauth2.googleapis.com/token'
  const now = Math.floor(Date.now() / 1000)

  const claims: JwtClaims = {
    iss: clientEmail,
    scope: options.scopes.join(' '),
    aud: tokenUrl,
    iat: now,
    exp: now + 3600,
  }

  if (options.subjectEmail) {
    claims.sub = options.subjectEmail
  }

  const assertion = jwt.sign(claims, privateKey, { algorithm: 'RS256' })

  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  })

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Failed to get SA token: ${res.status} ${txt}`)
  }

  const json = await res.json()
  return json.access_token as string
}































