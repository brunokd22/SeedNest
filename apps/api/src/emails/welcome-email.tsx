import { Body, Container, Head, Heading, Hr, Html, Text } from '@react-email/components';
import { UserRole } from '@seednest/shared';

const PRIMARY = '#2D6A4F';

const NEXT_STEPS: Record<UserRole, string> = {
  [UserRole.MANAGER]:  'Set up your nursery and start listing seedlings',
  [UserRole.CUSTOMER]: 'Browse nurseries and find your first seedling',
  [UserRole.ADMIN]:    'Head to the admin panel to manage the platform',
};

export function WelcomeEmail({ name, role }: { name: string; role: UserRole }) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', backgroundColor: '#ffffff', borderRadius: 8, padding: 32 }}>
          <Heading style={{ color: PRIMARY, fontSize: 24, marginBottom: 8 }}>
            Welcome to SeedNest, {name}!
          </Heading>
          <Text style={{ color: '#374151', lineHeight: 1.6 }}>
            We're thrilled to have you on board. Here's how to get started:
          </Text>
          <Text style={{ color: '#374151', lineHeight: 1.6, fontWeight: 600 }}>
            {NEXT_STEPS[role] ?? NEXT_STEPS[UserRole.CUSTOMER]}
          </Text>
          <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0' }} />
          <Text style={{ color: '#9ca3af', fontSize: 12 }}>
            The SeedNest Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
