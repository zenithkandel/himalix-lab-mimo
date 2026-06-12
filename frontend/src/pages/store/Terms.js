import React from 'react';
import { Link } from 'react-router-dom';
import StoreNavbar from '../../components/store/Navbar';

export default function Terms() {
  return (
    <div className="store-page">
      <StoreNavbar />
      <div className="store-layout" style={{ maxWidth: 720 }}>
        <div className="page-header">
          <h1 className="page-title">Terms & Conditions</h1>
          <p className="page-subtitle">Last updated: June 2025</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', fontSize: 'var(--text-sm)', color: 'var(--text-1)', lineHeight: 1.85 }}>
          {[
            {
              title: '1. Orders & Payment',
              text: 'All orders are subject to product availability. Payment is collected at time of order placement. We reserve the right to cancel orders that cannot be fulfilled.'
            },
            {
              title: '2. Shipping & Delivery',
              text: 'Delivery times are estimates calculated based on your location from our Kathmandu headquarters. Himalix Labs is not responsible for delays caused by events outside our control.'
            },
            {
              title: '3. Returns & Refunds',
              text: 'Returns are accepted within 7 days of delivery for defective or incorrect items. Items must be unused and in original packaging. Contact us to initiate a return.'
            },
            {
              title: '4. Wallet Credits',
              text: 'Wallet credits are non-transferable and cannot be converted to cash. Credits expire 12 months from the date of issue if unused. Referral credits are applied after the referred user places their first order.'
            },
            {
              title: '5. User Accounts',
              text: 'You are responsible for maintaining the security of your account credentials. Himalix Labs is not liable for losses resulting from unauthorized account access.'
            },
            {
              title: '6. Intellectual Property',
              text: 'All content on this platform — including product images, text, and design — is the property of Himalix Labs and may not be reproduced without permission.'
            },
            {
              title: '7. Governing Law',
              text: 'These terms are governed by the laws of Nepal. Any disputes shall be resolved in the courts of Kathmandu district.'
            },
          ].map(section => (
            <div key={section.title}>
              <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-0)', marginBottom: 'var(--space-3)' }}>
                {section.title}
              </h2>
              <p>{section.text}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'var(--space-10)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--border)' }}>
          <Link to="/store" className="btn btn-outline">
            <i className="fa-light fa-sharp fa-arrow-left" /> Back to Store
          </Link>
        </div>
      </div>
    </div>
  );
}
