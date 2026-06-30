import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from './AuthContext'
import { pointsService } from '../services/pointsService'
import { canSelectActivePoint } from '../utils/userDisplay'

const STORAGE_KEY = 'tea_crm_active_point_id'

const PointContext = createContext(null)

export const usePointContext = () => {
  const ctx = useContext(PointContext)
  if (!ctx) {
    throw new Error('usePointContext must be used within PointProvider')
  }
  return ctx
}

function readStoredPointId() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw == null || raw === '') return null
    const id = parseInt(raw, 10)
    return Number.isNaN(id) ? null : id
  } catch {
    return null
  }
}

export const PointProvider = ({ children }) => {
  const { user, isAuthenticated, ensureValidToken, refreshAccessToken } = useAuth()
  const [points, setPoints] = useState([])
  const [activePointId, setActivePointIdState] = useState(null)

  const canSelectPoint = canSelectActivePoint(user)

  const loadPoints = useCallback(async () => {
    if (!isAuthenticated || !canSelectActivePoint(user)) return
    await ensureValidToken()
    try {
      const list = await pointsService.getPoints()
      setPoints(Array.isArray(list) ? list : [])
    } catch (e) {
      if (e?.message === 'UNAUTHORIZED') {
        await refreshAccessToken()
        const list = await pointsService.getPoints()
        setPoints(Array.isArray(list) ? list : [])
      }
    }
  }, [isAuthenticated, user, ensureValidToken, refreshAccessToken])

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setPoints([])
      setActivePointIdState(null)
      return
    }

    if (canSelectActivePoint(user)) {
      loadPoints()
      const stored = readStoredPointId()
      setActivePointIdState(stored === 2 ? 2 : 1)
    } else {
      setPoints([])
      setActivePointIdState(user.pointId ?? null)
    }
  }, [isAuthenticated, user, loadPoints])

  const setActivePointId = useCallback((id) => {
    const num = typeof id === 'number' ? id : parseInt(id, 10)
    if (Number.isNaN(num)) return
    setActivePointIdState(num)
    try {
      localStorage.setItem(STORAGE_KEY, String(num))
    } catch {
      /* ignore */
    }
  }, [])

  const activePointName = useMemo(() => {
    if (canSelectPoint) {
      return points.find((p) => p.id === activePointId)?.name ?? null
    }
    return user?.pointName ?? null
  }, [canSelectPoint, points, activePointId, user?.pointName])

  const value = useMemo(
    () => ({
      points,
      activePointId,
      activePointName,
      canSelectPoint,
      setActivePointId,
      loadPoints
    }),
    [points, activePointId, activePointName, canSelectPoint, setActivePointId, loadPoints]
  )

  return <PointContext.Provider value={value}>{children}</PointContext.Provider>
}
