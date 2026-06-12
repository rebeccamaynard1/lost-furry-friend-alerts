import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Lost Furry Friend Alerts"
const SITE_URL = "https://lostfurryfriendalerts.com"

interface BoostExpiryProps {
  kind?: 'expiring_soon' | 'expired'
  tier?: string
  expires_at?: string
  hours_left?: number
}

const tierLabel = (t?: string) =>
  t === 'extended' ? 'Extended Boost' : t === 'standard' ? 'Standard Boost' : 'Alert Boost'

const BoostExpiryEmail = ({
  kind = 'expiring_soon',
  tier,
  expires_at,
  hours_left = 24,
}: BoostExpiryProps) => {
  const isExpired = kind === 'expired'
  const label = tierLabel(tier)
  const niceExpiry = expires_at
    ? new Date(expires_at).toLocaleString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit',
      })
    : ''

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {isExpired
          ? `Your ${label} has expired`
          : `Your ${label} expires in ${hours_left} hours`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Text style={headerEmoji}>🐾</Text>
            <Heading style={h1}>{SITE_NAME}</Heading>
          </Section>

          <Section style={isExpired ? expiredBanner : warningBanner}>
            <Heading style={alertTitle}>
              {isExpired ? 'Your Alert Boost has expired' : 'Your Alert Boost is expiring soon'}
            </Heading>
          </Section>

          <Text style={text}>
            {isExpired
              ? `Your ${label} has expired. Your lost pet report will no longer get top placement or extended reach.`
              : `Your ${label} expires in about ${hours_left} hours${niceExpiry ? ` on ${niceExpiry}` : ''}.`}
          </Text>

          <Section style={detailsCard}>
            <Text style={detailRow}><strong>Boost:</strong> {label}</Text>
            {niceExpiry && (
              <Text style={detailRow}>
                <strong>{isExpired ? 'Expired:' : 'Expires:'}</strong> {niceExpiry}
              </Text>
            )}
          </Section>

          <Text style={text}>
            {isExpired
              ? 'Need more time to find them? Renew with a new boost to keep your report at the top.'
              : 'Want to keep the extra reach going? You can purchase another boost any time.'}
          </Text>

          <Section style={ctaSection}>
            <Button style={ctaButton} href={`${SITE_URL}/premium`}>
              {isExpired ? 'Renew Alert Boost' : 'Extend Your Boost'}
            </Button>
          </Section>

          <Hr style={divider} />

          <Text style={footer}>
            You're receiving this because you purchased an Alert Boost on {SITE_NAME}.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: BoostExpiryEmail,
  subject: (data: Record<string, any>) =>
    data.kind === 'expired'
      ? `Your Alert Boost has expired`
      : `Your Alert Boost expires in ${data.hours_left ?? 24} hours`,
  displayName: 'Alert Boost Expiry',
  previewData: {
    kind: 'expiring_soon',
    tier: 'standard',
    expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    hours_left: 24,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Nunito', Arial, sans-serif" }
const container = { padding: '0', maxWidth: '600px', margin: '0 auto' }
const headerSection: React.CSSProperties = { textAlign: 'center', padding: '30px 25px 10px', backgroundColor: '#0891b2' }
const headerEmoji: React.CSSProperties = { fontSize: '36px', margin: '0', lineHeight: '1' }
const h1: React.CSSProperties = { fontSize: '22px', fontWeight: '800', color: '#ffffff', margin: '8px 0 0' }
const warningBanner: React.CSSProperties = { backgroundColor: '#f59e0b', padding: '14px 25px', textAlign: 'center' }
const expiredBanner: React.CSSProperties = { backgroundColor: '#64748b', padding: '14px 25px', textAlign: 'center' }
const alertTitle: React.CSSProperties = { fontSize: '17px', fontWeight: '800', color: '#ffffff', margin: '0', letterSpacing: '0.5px' }
const text: React.CSSProperties = { fontSize: '14px', color: '#475569', lineHeight: '1.6', padding: '0 25px', margin: '16px 0' }
const detailsCard: React.CSSProperties = { backgroundColor: '#f0f9ff', borderRadius: '8px', padding: '16px 20px', margin: '0 25px 16px' }
const detailRow: React.CSSProperties = { fontSize: '14px', color: '#334155', margin: '4px 0', lineHeight: '1.5' }
const divider: React.CSSProperties = { borderColor: '#e2e8f0', margin: '20px 25px' }
const ctaSection: React.CSSProperties = { textAlign: 'center', padding: '4px 25px 20px' }
const ctaButton: React.CSSProperties = { backgroundColor: '#f59e0b', color: '#ffffff', padding: '12px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: '700', textDecoration: 'none' }
const footer: React.CSSProperties = { fontSize: '12px', color: '#94a3b8', lineHeight: '1.5', padding: '0 25px 30px', textAlign: 'center' }
