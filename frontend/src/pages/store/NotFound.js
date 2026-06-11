import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="not-found">
      <div className="not-found-content">
        <div className="not-found-code">404</div>
        <h2>SYSTEM ERROR: PATHWAY NOT FOUND</h2>
        <p>
          The requested route does not exist within the system.
          <br />
          Verify the address and try again.
        </p>
        <Link to="/" className="btn btn-primary">
          RETURN TO STORE
        </Link>
      </div>
    </div>
  );
}
