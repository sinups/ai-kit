import React from 'react';
import { SpiralLoader } from './SpiralLoader';

export default { title: 'Status/SpiralLoader' };

export function Usage() {
  return (
    <div style={{ padding: 40, display: 'flex', gap: 24, alignItems: 'center' }}>
      <SpiralLoader size={12} />
      <SpiralLoader size={16} />
      <SpiralLoader size={32} />
    </div>
  );
}
