/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "cvZen"
const SITE_URL = "https://cvzen.ai"

interface WelcomeSignupProps {
  name?: string
  role?: string
}

const WelcomeSignupEmail = ({ name, role }: WelcomeSignupProps) => {
  const greeting = name ? `Welcome, ${name}!` : 'Welcome to cvZen!'
  const roleMessage = role === 'recruiter'
    ? 'Start posting jobs and discovering top talent with AI-powered semantic search.'
    : 'Upload your resume, get AI-powered ATS scoring, and create your digital profile.'

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Welcome to cvZen — your Intelligent Hiring OS</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>cvZen</Text>
          </Section>
          <Hr style={divider} />
          <Heading style={h1}>{greeting}</Heading>
          <Text style={text}>
            Thank you for joining <strong>cvZen</strong> — the Intelligent Hiring OS that connects talent with opportunity through meaning, not just keywords.
          </Text>
          <Text style={text}>{roleMessage}</Text>
          <Section style={buttonSection}>
            <Button style={button} href={`${SITE_URL}/login`}>
              Get Started
            </Button>
          </Section>
          <Hr style={divider} />
          <Text style={footerText}>
            If you have any questions, reply to this email or visit{' '}
            <a href={SITE_URL} style={link}>cvzen.ai</a>.
          </Text>
          <Text style={footerText}>
            Best regards,<br />The {SITE_NAME} Team
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: WelcomeSignupEmail,
  subject: 'Welcome to cvZen — Let\'s get started!',
  displayName: 'Welcome signup',
  previewData: { name: 'Jane Doe', role: 'candidate' },
} satisfies TemplateEntry

// Styles — brand: Azure #1891db, Dark Navy #0a0a37
const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '40px 24px', maxWidth: '560px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, marginBottom: '8px' }
const logoText = { fontSize: '28px', fontWeight: '700', color: '#0a0a37', margin: '0', letterSpacing: '-0.5px' }
const divider = { borderColor: '#e5e7eb', margin: '24px 0' }
const h1 = { fontSize: '24px', fontWeight: '700', color: '#0a0a37', margin: '0 0 16px', lineHeight: '1.3' }
const text = { fontSize: '15px', color: '#4b5563', lineHeight: '1.6', margin: '0 0 16px' }
const buttonSection = { textAlign: 'center' as const, margin: '28px 0' }
const button = {
  backgroundColor: '#1891db',
  color: '#ffffff',
  padding: '12px 32px',
  borderRadius: '8px',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  display: 'inline-block',
}
const link = { color: '#1891db', textDecoration: 'underline' }
const footerText = { fontSize: '13px', color: '#9ca3af', lineHeight: '1.5', margin: '0 0 8px' }
