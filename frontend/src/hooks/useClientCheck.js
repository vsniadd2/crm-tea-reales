import { useState, useEffect, useRef } from 'react'
import { clientService } from '../services/clientService'
import { useAuth } from '../contexts/AuthContext'
import { buildPurchaseDiscountInfo } from '../utils/clientDiscount'

export const useClientCheck = (clientId, price) => {
  const [clientInfo, setClientInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const { refreshAccessToken } = useAuth()
  const abortControllerRef = useRef(null)
  const cacheRef = useRef(new Map())

  useEffect(() => {
    if (!clientId) {
      setClientInfo(null)
      return
    }

    const checkClient = async () => {
      try {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
        abortControllerRef.current = new AbortController()

        if (cacheRef.current.has(clientId)) {
          const cached = cacheRef.current.get(clientId)
          const age = Date.now() - cached.timestamp
          if (age < 3000) {
            setClientInfo(cached.data)
            return
          }
        }

        setLoading(true)
        const client = await clientService.getById(clientId)
        
        requestAnimationFrame(() => {
          setClientInfo(client)
          cacheRef.current.set(clientId, {
            data: client,
            timestamp: Date.now()
          })
        })
      } catch (err) {
        if (err.name === 'AbortError') {
          return
        }
        if (err.message === 'UNAUTHORIZED') {
          await refreshAccessToken()
        }
        setClientInfo(null)
      } finally {
        setLoading(false)
      }
    }

    checkClient()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [clientId, refreshAccessToken])

  const calculateDiscount = () => {
    if (!price || price <= 0) return null
    return buildPurchaseDiscountInfo(clientInfo, price)
  }

  return {
    clientInfo,
    loading,
    discountInfo: calculateDiscount()
  }
}
