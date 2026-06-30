import React from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { PointProvider } from './contexts/PointContext'
import { DataRefreshProvider } from './contexts/DataRefreshContext'
import AppRouter from './components/AppRouter'
import NotificationProvider from './components/NotificationProvider'

function App() {
  return (
    <AuthProvider>
      <PointProvider>
        <DataRefreshProvider>
          <NotificationProvider>
            <AppRouter />
          </NotificationProvider>
        </DataRefreshProvider>
      </PointProvider>
    </AuthProvider>
  )
}

export default App
