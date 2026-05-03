import { Body, Button, Container, Head, Heading, Hr, Html, Text } from '@react-email/components';

const PRIMARY = '#2D6A4F';

export function ResetPasswordEmail({ url }: { url: string }) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', backgroundColor: '#ffffff', borderRadius: 8, padding: 32 }}>
          <Heading style={{ color: PRIMARY, fontSize: 24, marginBottom: 8 }}>
            Reset your password
          </Heading>
          <Text style={{ color: '#374151', lineHeight: 1.6 }}>
            We received a request to reset your SeedNest password. Click the button below to choose a new password. This link expires in 1 hour.
          </Text>
          <Button
            href={url}
            style={{ backgroundColor: PRIMARY, color: '#ffffff', borderRadius: 6, padding: '12px 24px', display: 'inline-block', textDecoration: 'none', fontWeight: 600 }}
          >
            Reset password
          </Button>
          <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0' }} />
          <Text style={{ color: '#9ca3af', fontSize: 12 }}>
            If you didn't request a password reset, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
