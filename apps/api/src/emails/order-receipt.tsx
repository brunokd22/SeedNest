import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Row,
  Section,
  Text,
} from '@react-email/components';

const PRIMARY = '#2D6A4F';
const LIGHT_GREEN = '#D8F3DC';

interface OrderItem {
  name: string;
  size: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface OrderReceiptEmailProps {
  orderNumber: string;
  customerName: string;
  nurseryName: string;
  items: OrderItem[];
  totalAmount: number;
  fulfillmentType: 'DELIVERY' | 'PICKUP';
  deliveryAddress?: string;
  orderId: string;
}

export function OrderReceiptEmail({
  orderNumber,
  customerName,
  nurseryName,
  items,
  totalAmount,
  fulfillmentType,
  deliveryAddress,
  orderId,
}: OrderReceiptEmailProps) {
  const trackingUrl = `${process.env.FRONTEND_URL ?? 'https://seednest.app'}/my-orders/${orderId}`;

  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'sans-serif', margin: 0, padding: 0 }}>
        {/* Header */}
        <Section style={{ backgroundColor: PRIMARY, padding: '24px 0', textAlign: 'center' }}>
          <Text style={{ color: '#ffffff', fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: 1 }}>
            SeedNest
          </Text>
        </Section>

        <Container style={{ maxWidth: 600, margin: '0 auto', backgroundColor: '#ffffff', padding: '32px 32px 24px' }}>
          {/* Greeting */}
          <Text style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
            Thank you for your order, {customerName}!
          </Text>

          {/* Order badge */}
          <Section style={{ backgroundColor: '#F0FDF4', borderRadius: 8, padding: '12px 16px', margin: '16px 0' }}>
            <Text style={{ margin: 0, fontSize: 15, color: PRIMARY, fontWeight: 700 }}>
              Order #{orderNumber}
            </Text>
            <Text style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
              Placed at {nurseryName}
            </Text>
          </Section>

          {/* Items table header */}
          <Section style={{ marginTop: 24 }}>
            <Row style={{ backgroundColor: '#F9FAFB', borderRadius: '6px 6px 0 0', padding: '8px 0' }}>
              <Column style={thCol('38%')}>
                <Text style={thText}>Item</Text>
              </Column>
              <Column style={thCol('14%')}>
                <Text style={{ ...thText, textAlign: 'center' }}>Size</Text>
              </Column>
              <Column style={thCol('10%')}>
                <Text style={{ ...thText, textAlign: 'center' }}>Qty</Text>
              </Column>
              <Column style={thCol('18%')}>
                <Text style={{ ...thText, textAlign: 'right' }}>Unit Price</Text>
              </Column>
              <Column style={thCol('20%')}>
                <Text style={{ ...thText, textAlign: 'right' }}>Subtotal</Text>
              </Column>
            </Row>

            {/* Item rows */}
            {items.map((item, idx) => (
              <Row
                key={idx}
                style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#F9FAFB', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}
              >
                <Column style={thCol('38%')}>
                  <Text style={cellText}>{item.name}</Text>
                </Column>
                <Column style={thCol('14%')}>
                  <Text style={{ ...cellText, textAlign: 'center' }}>{item.size}</Text>
                </Column>
                <Column style={thCol('10%')}>
                  <Text style={{ ...cellText, textAlign: 'center' }}>{item.quantity}</Text>
                </Column>
                <Column style={thCol('18%')}>
                  <Text style={{ ...cellText, textAlign: 'right' }}>
                    UGX {item.unitPrice.toLocaleString()}
                  </Text>
                </Column>
                <Column style={thCol('20%')}>
                  <Text style={{ ...cellText, textAlign: 'right' }}>
                    UGX {item.subtotal.toLocaleString()}
                  </Text>
                </Column>
              </Row>
            ))}

            {/* Total row */}
            <Row style={{ backgroundColor: '#F0FDF4', padding: '10px 0', borderRadius: '0 0 6px 6px' }}>
              <Column style={thCol('62%')}>
                <Text style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827', textAlign: 'right', paddingRight: 8 }}>
                  Total
                </Text>
              </Column>
              <Column style={thCol('18%')}>
                <Text style={{ margin: 0 }} />
              </Column>
              <Column style={thCol('20%')}>
                <Text style={{ margin: 0, fontSize: 15, fontWeight: 700, color: PRIMARY, textAlign: 'right' }}>
                  UGX {totalAmount.toLocaleString()}
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Fulfillment info */}
          <Section style={{ backgroundColor: LIGHT_GREEN, borderRadius: 8, padding: '14px 16px', margin: '24px 0 16px' }}>
            <Text style={{ margin: 0, fontSize: 14, color: '#1B4332', fontWeight: 600 }}>
              {fulfillmentType === 'DELIVERY'
                ? `🚚 Delivery to: ${deliveryAddress ?? 'Address on file'}`
                : `🏪 Ready for Pickup at ${nurseryName}`}
            </Text>
          </Section>

          {/* CTA */}
          <Section style={{ textAlign: 'center', marginBottom: 24 }}>
            <Button
              href={trackingUrl}
              style={{
                backgroundColor: PRIMARY,
                color: '#ffffff',
                borderRadius: 6,
                padding: '12px 28px',
                fontWeight: 600,
                fontSize: 15,
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              View My Order
            </Button>
          </Section>

          {/* Care reminder note */}
          <Text style={{ fontSize: 13, color: '#6B7280', fontStyle: 'italic', textAlign: 'center', margin: '0 0 24px' }}>
            We'll send you care tips for your seedlings in a few days — keep an eye on your inbox!
          </Text>

          <Hr style={{ borderColor: '#E5E7EB', margin: '0 0 20px' }} />

          {/* Footer */}
          <Text style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', margin: 0 }}>
            SeedNest — connecting plant lovers with local nurseries
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const thCol = (width: string): React.CSSProperties => ({ width, padding: '0 4px' });
const thText: React.CSSProperties = { margin: 0, fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase' as const };
const cellText: React.CSSProperties = { margin: 0, fontSize: 13, color: '#374151' };
