import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section, Img, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Lost Furry Friend Alerts"

interface LostPetAlertProps {
  pet_name?: string
  species?: string
  breed?: string
  color?: string
  description?: string
  last_seen_address?: string
  contact_name?: string
  contact_phone?: string
  contact_email?: string
  photo_url?: string
  partner_name?: string
}

const LostPetAlertEmail = ({
  pet_name = 'Unknown',
  species = 'Pet',
  breed,
  color,
  description,
  last_seen_address,
  contact_name,
  contact_phone,
  contact_email,
  photo_url,
  partner_name,
}: LostPetAlertProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>🚨 Lost {species} Alert: {pet_name} needs your help!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Text style={headerEmoji}>🐾</Text>
          <Heading style={h1}>{SITE_NAME}</Heading>
        </Section>

        <Section style={alertBanner}>
          <Heading style={alertTitle}>🚨 LOST PET ALERT</Heading>
        </Section>

        {partner_name && (
          <Text style={greeting}>Dear {partner_name},</Text>
        )}

        <Text style={text}>
          A {species}{breed ? ` (${breed})` : ''} named <strong>"{pet_name}"</strong> has been reported lost and needs your help!
        </Text>

        {photo_url && (
          <Section style={photoSection}>
            <Img src={photo_url} alt={`Photo of ${pet_name}`} style={petPhoto} />
          </Section>
        )}

        <Section style={detailsCard}>
          <Heading style={h2}>Pet Details</Heading>
          <Text style={detailRow}><strong>Name:</strong> {pet_name}</Text>
          <Text style={detailRow}><strong>Species:</strong> {species}</Text>
          {breed && <Text style={detailRow}><strong>Breed:</strong> {breed}</Text>}
          {color && <Text style={detailRow}><strong>Color:</strong> {color}</Text>}
          {last_seen_address && <Text style={detailRow}><strong>Last Seen:</strong> {last_seen_address}</Text>}
          {description && <Text style={detailRow}><strong>Description:</strong> {description}</Text>}
        </Section>

        <Hr style={divider} />

        <Section style={detailsCard}>
          <Heading style={h2}>Contact Information</Heading>
          {contact_name && <Text style={detailRow}><strong>Name:</strong> {contact_name}</Text>}
          {contact_phone && <Text style={detailRow}><strong>Phone:</strong> {contact_phone}</Text>}
          {contact_email && <Text style={detailRow}><strong>Email:</strong> {contact_email}</Text>}
        </Section>

        <Text style={text}>
          If you have any information about this pet, please contact the owner directly or report a sighting through our platform.
        </Text>

        <Section style={ctaSection}>
          <Button style={ctaButton} href="https://lostfurryfriendalerts.com/sightings">
            Report a Sighting
          </Button>
        </Section>

        <Hr style={divider} />

        <Text style={footer}>
          You are receiving this alert because you are a registered partner with {SITE_NAME}.
          Thank you for helping reunite lost pets with their families! 🐾
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: LostPetAlertEmail,
  subject: (data: Record<string, any>) => `🚨 Lost Pet Alert: ${data.pet_name || 'Unknown'} — ${data.species || 'Pet'} needs your help!`,
  displayName: 'Lost Pet Alert',
  previewData: {
    pet_name: 'Buddy',
    species: 'Dog',
    breed: 'Golden Retriever',
    color: 'Golden',
    description: 'Friendly, wearing a red collar with tags',
    last_seen_address: 'Birmingham, Alabama',
    contact_name: 'Jane Doe',
    contact_phone: '(205) 555-0123',
    contact_email: 'jane@example.com',
    photo_url: '',
    partner_name: 'Birmingham Humane Society',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Nunito', Arial, sans-serif" }
const container = { padding: '0', maxWidth: '600px', margin: '0 auto' }
const headerSection: React.CSSProperties = { textAlign: 'center', padding: '30px 25px 10px', backgroundColor: '#0891b2' }
const headerEmoji: React.CSSProperties = { fontSize: '36px', margin: '0', lineHeight: '1' }
const h1: React.CSSProperties = { fontSize: '22px', fontWeight: '800', color: '#ffffff', margin: '8px 0 0' }
const alertBanner: React.CSSProperties = { backgroundColor: '#ef4444', padding: '12px 25px', textAlign: 'center' }
const alertTitle: React.CSSProperties = { fontSize: '18px', fontWeight: '800', color: '#ffffff', margin: '0', letterSpacing: '1px' }
const greeting: React.CSSProperties = { fontSize: '15px', color: '#334155', padding: '20px 25px 0', margin: '0' }
const text: React.CSSProperties = { fontSize: '14px', color: '#475569', lineHeight: '1.6', padding: '0 25px', margin: '12px 0' }
const photoSection: React.CSSProperties = { textAlign: 'center', padding: '10px 25px' }
const petPhoto: React.CSSProperties = { maxWidth: '100%', maxHeight: '300px', borderRadius: '12px', objectFit: 'cover' as const }
const detailsCard: React.CSSProperties = { backgroundColor: '#f0f9ff', borderRadius: '8px', padding: '16px 20px', margin: '0 25px 16px' }
const h2: React.CSSProperties = { fontSize: '16px', fontWeight: '700', color: '#0891b2', margin: '0 0 10px' }
const detailRow: React.CSSProperties = { fontSize: '14px', color: '#334155', margin: '4px 0', lineHeight: '1.5' }
const divider: React.CSSProperties = { borderColor: '#e2e8f0', margin: '20px 25px' }
const ctaSection: React.CSSProperties = { textAlign: 'center', padding: '10px 25px 20px' }
const ctaButton: React.CSSProperties = { backgroundColor: '#0891b2', color: '#ffffff', padding: '12px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: '700', textDecoration: 'none' }
const footer: React.CSSProperties = { fontSize: '12px', color: '#94a3b8', lineHeight: '1.5', padding: '0 25px 30px', textAlign: 'center' }
