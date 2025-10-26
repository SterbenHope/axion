import React from 'react';
import { AuthProvider } from '../hooks/useAuth';
import '../App.css';
import '../index.css';

export const metadata = {
  title: 'Axion Casino',
  description: 'Premium Online Casino',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

