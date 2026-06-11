import React from 'react';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="terms-page" style={{ padding: '40px 16px', backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', padding: '40px 32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        
        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '20px', marginBottom: '32px' }}>
          <Link to="/store" style={{ textDecoration: 'none', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', marginBottom: '16px', fontWeight: 600 }}>
            <i className="fa-sharp-duotone fa-light fa-arrow-left"></i> Back to Storefront
          </Link>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Terms & Conditions</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>Last Updated: June 11, 2026</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', lineHeight: '1.7', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
          
          <section>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>1. Agreement to Terms</h3>
            <p>
              By accessing and placing an order with Himalix Store, you confirm your agreement to be bound by the terms of service contained in the Terms & Conditions outlined below. These terms apply to the entire website and any email or other type of communication between you and Himalix Labs.
            </p>
          </section>

          <section>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>2. Account Registration</h3>
            <p>
              To use certain features of the store, including tracking orders, maintaining a wallet balance, and submitting reviews, you must create a verified account. You agree to provide accurate information and keep your credentials secure. Himalix reserves the right to suspend accounts showing fraudulent activity.
            </p>
          </section>

          <section>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>3. Dynamic Delivery ETA Calculations</h3>
            <p>
              Himalix Store calculates estimated delivery dates dynamically to optimize transparency:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <strong>In-Stock Products:</strong> Subject to a standard 1-day processing delay and a 1-day shipping delay. Total estimated delivery time is 2 to 3 days from the checkout date.
              </li>
              <li>
                <strong>Outsourced Products:</strong> Products sourced from external partners are subject to an additional estimated sourcing period (defined by the administrator on each product item). The dynamic ETA equals 1 day (processing) + outsourcing days + 1 to 2 days transit time.
              </li>
              <li>
                <strong>Order Consolidation:</strong> If an order contains both in-stock and outsourced items, the entire delivery delay defaults to the maximum processing time of the outsourced items.
              </li>
            </ul>
          </section>

          <section>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>4. Distance-Based Delivery Cost</h3>
            <p>
              Delivery rates are calculated dynamically based on the straight-line Haversine distance from the Himalix Labs headquarters in Basantapur, Kathmandu to the GPS coordinates pinned by the buyer during checkout. A minimum base fare is charged. Orders exceeding the free delivery threshold receive complimentary delivery.
            </p>
          </section>

          <section>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>5. Payment & Store Credit</h3>
            <p>
              We accept Cash on Delivery (COD) and Store Credit (prepaid wallet). When selecting Store Credit, the total checkout amount (including dynamic shipping and taxes) is deducted immediately from your wallet balance. Standard referrals and social click claims credit your wallet automatically upon validation.
            </p>
          </section>

          <section>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>6. Emergency Support</h3>
            <p>
              In case of emergency delivery delays, urgent changes to shipping details, or technical system failures, please consult the support details displayed on your checkout confirmation page or reach out using the system's registered operator details.
            </p>
          </section>

        </div>
        
        <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
          <Link to="/store" className="btn btn-primary" style={{ padding: '12px 24px', textDecoration: 'none' }}>
            I Understand
          </Link>
        </div>

      </div>
    </div>
  );
}
