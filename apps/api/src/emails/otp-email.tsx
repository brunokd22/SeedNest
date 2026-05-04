import { Body, Container, Head, Heading, Hr, Html, Text } from '@react-email/components';

const PRIMARY = '#2D6A4F';

export function OtpEmail({ otp }: { otp: string }) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', backgroundColor: '#ffffff', borderRadius: 8, padding: 32 }}>
          <Heading style={{ color: PRIMARY, fontSize: 24, marginBottom: 8 }}>
            Verify your SeedNest email
          </Heading>
          <Text style={{ color: '#374151', lineHeight: 1.6 }}>
            Your verification code is:
          </Text>
          <Text style={{ fontSize: 40, fontWeight: 700, letterSpacing: 12, color: PRIMARY, textAlign: 'center', margin: '16px 0' }}>
            {otp}
          </Text>
          <Text style={{ color: '#374151', lineHeight: 1.6 }}>
            This code expires in 10 minutes. Do not share it with anyone.
          </Text>
          <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0' }} />
          <Text style={{ color: '#9ca3af', fontSize: 12 }}>
            If you didn't create a SeedNest account, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
