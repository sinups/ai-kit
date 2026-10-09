import React from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '../../package/dist/styles.css';
import { LayersLayoutDemo } from './demo';

createRoot(document.getElementById('root')!).render(
  <MantineProvider defaultColorScheme="light">
    <LayersLayoutDemo />
  </MantineProvider>
);
