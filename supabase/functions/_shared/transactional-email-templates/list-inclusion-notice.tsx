/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  recipient_name?: string
}

const Email = ({ recipient_name }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You're on the Lost Furry Friend Alerts network</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>You're on our alert list 🐾</Heading>
        <Text style={text}>
          {recipient_name ? `Hi ${recipient_name},` : 'Hello,'}
        </Text>
        <Text style={text}>
          You're receiving this note because your email is included in the{' '}
          <strong>Lost Furry Friend Alerts</strong> partner network — a group of
          shelters, vet clinics, rescues, volunteers, and community partners
          across Alabama and beyond who help reunite lost pets with their
          families.
        </Text>
        <Section style={panel}>
          <Text style={panelText}>
            <strong>What this means:</strong> whenever someone reports a lost
            pet, a found pet, or a sighting through our site, you'll get a quick
            email alert so you can keep an eye out. That's it — no newsletters,
            no marketing.
          </Text>
        </Section>
        <Text style={text}>
          If you'd rather <strong>not</strong> receive these alerts, just reach
          out to Rebecca and we'll remove you right away:
        </Text>
        <Text style={contact}>
          📧 <Link href="mailto:rebeccamaynard1@gmail.com" style={link}>rebeccamaynard1@gmail.com</Link><br />
          📱 <Link href="sms:+12054936923" style={link}>(205) 493-6923</Link>
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          Thank you for being part of the network — every set of eyes helps
          bring a furry friend home.
        </Text>
        <Text style={footer}>
          — In loving memory of Little Foot 🐾
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: "You're on the Lost Furry Friend Alerts network 🐾",
  displayName: 'List Inclusion Notice',
  previewData: { recipient_name: 'Friend' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Quicksand, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = { fontFamily: 'Nunito, Arial, sans-serif', fontSize: '24px', color: '#1f6fb2', margin: '0 0 16px' }
const text = { fontSize: '15px', lineHeight: '1.6', color: '#333333', margin: '0 0 14px' }
const panel = { background: '#f5faff', borderLeft: '4px solid #1f6fb2', padding: '14px 16px', borderRadius: '6px', margin: '16px 0' }
const panelText = { fontSize: '14px', lineHeight: '1.6', color: '#333333', margin: 0 }
const contact = { fontSize: '15px', lineHeight: '1.9', color: '#333333', margin: '0 0 14px' }
const link = { color: '#1f6fb2', textDecoration: 'underline' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0 16px' }
const footer = { fontSize: '13px', color: '#666666', margin: '0 0 6px' }
