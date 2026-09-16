import React from 'react';
import { ErrorMessage } from './ErrorMessage';

export default { title: 'ErrorMessage' };

export function Usage() {
  return (
    <div style={{ padding: 40, maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ErrorMessage message="The model returned an empty response. Please try again." />
      <ErrorMessage
        title="Request failed"
        message="Network error: failed to fetch (status 502 Bad Gateway)"
      />
    </div>
  );
}
