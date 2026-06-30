import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Login from './Login'
import PurchaseHistory from './PurchaseHistory'
import Header from './Header'
import ClientList from './ClientList'
import ClientModal from './ClientModal'
import CategoriesManageModal from './CategoriesManageModal'
import NewClientPage from './NewClientPage'
import StatsPage from './StatsPage'
import CategoriesPage from './CategoriesPage'
import Footer from './Footer'
import './Dashboard.css'

const AppRouter = () => {
  const { isAuthenticated, loading } = useAuth()
  const [currentPage, setCurrentPage] = useState(() => {
    // Загружаем последнюю открытую страницу из localStorage
    try {
      const savedPage = localStorage.getItem('currentPage') || 'new-client'
      // Миграция старых значений страниц
      if (savedPage === 'payment-stats' || savedPage === 'sales-stats' || savedPage === 'order-details' || savedPage === 'order-search') {
        return 'stats'
      }
      return savedPage
    } catch {
      return 'new-client'
    }
  })
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Сохраняем текущую страницу в localStorage при изменении
  const handleNavigate = (page) => {
    setCurrentPage(page)
    try {
      localStorage.setItem('currentPage', page)
    } catch (error) {
      console.error('Ошибка сохранения страницы:', error)
    }
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        color: 'white',
        fontSize: '1.5rem'
      }}>
        Загрузка...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login />
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'clients':
        return <ClientList />
      case 'purchase-history':
        return <PurchaseHistory />
      case 'stats':
      case 'payment-stats':
      case 'sales-stats':
      case 'order-details':
        return <StatsPage />
      case 'categories':
        return <CategoriesPage />
      case 'new-client':
      default:
        return <NewClientPage />
    }
  }

  return (
    <div className="main-screen">
      <div className="main-screen-content">
        <Header
          onAddClient={() => setIsModalOpen(true)}
          currentPage={currentPage}
          onNavigate={handleNavigate}
        />
        <main className="main-content">
          {renderPage()}
        </main>
        <Footer />
        {isModalOpen && (
          <ClientModal onClose={() => setIsModalOpen(false)} />
        )}
      </div>
    </div>
  )
}

export default AppRouter
