import React from 'react';
import { TextShimmer } from './TextShimmer';

export default { title: 'Status/TextShimmer' };

export function Usage() {
  return (
    <div style={{ padding: 40, fontSize: 14 }}>
      <TextShimmer duration={1.2}>Thinking...</TextShimmer>
    </div>
  );
}
