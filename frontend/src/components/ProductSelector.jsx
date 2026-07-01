import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { getProductsTree } from '../services/productsService'
import { useAuth } from '../contexts/AuthContext'
import { useDataRefresh } from '../contexts/DataRefreshContext'
import {
  getBaseWeightGrams,
  getLineUnitPrice,
  getCartLineTotal,
  formatProductPriceLabel
} from '../utils/weightPricing'
import './ProductSelector.css'

function createCartEntry(product) {
  const baseGrams = getBaseWeightGrams(product)
  const grams = baseGrams ?? null
  return {
    product,
    quantity: 1,
    grams,
    unitPrice: getLineUnitPrice(product, grams)
  }
}

const ProductSelector = ({ onProductsChange, initialTotal = 0 }) => {
  const { refreshAccessToken } = useAuth()
  const { refreshKey } = useDataRefresh()
  const [productCategories, setProductCategories] = useState({})
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [productsError, setProductsError] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState(null)
  const [cart, setCart] = useState({}) // { productId: { product, quantity } }
  const [productSearchQuery, setProductSearchQuery] = useState('')

  const isInitialLoadRef = useRef(true)

  const loadProductsTree = useCallback(async (silent = false) => {
    try {
      // Показываем loading только при первой загрузке
      if (!silent && isInitialLoadRef.current) {
        setLoadingProducts(true)
      }
      setProductsError(null)
      const tree = await getProductsTree()
      setProductCategories(tree)
      isInitialLoadRef.current = false
      // Убеждаемся, что loading выключен после успешной загрузки
      if (!silent) {
        setLoadingProducts(false)
      }
    } catch (e) {
      console.error('Ошибка загрузки товаров:', e)
      if (e?.message === 'UNAUTHORIZED') {
        const ok = await refreshAccessToken()
        if (ok) return loadProductsTree(silent)
      }
      setProductsError(e?.message || 'Ошибка загрузки товаров')
      setProductCategories({})
      isInitialLoadRef.current = false
      // Убеждаемся, что loading выключен при ошибке
      setLoadingProducts(false)
    }
  }, [refreshAccessToken])

  useEffect(() => {
    loadProductsTree()
  }, [loadProductsTree])

  // Обновляем товары при изменении refreshKey без показа loading
  useEffect(() => {
    if (refreshKey > 0 && !isInitialLoadRef.current) {
      loadProductsTree(true)
    }
  }, [refreshKey, loadProductsTree])

  // Все товары с метаданными для глобального поиска (из загруженного дерева)
  const allProductsWithMeta = useMemo(() => {
    const result = []
    Object.values(productCategories).forEach(category => {
      Object.values(category.subcategories || {}).forEach(subcategory => {
        (subcategory.products || []).forEach(product => {
          result.push({
            product: {
              ...product,
              categoryName: category.name,
              subcategoryName: subcategory.name
            },
            categoryName: category.name,
            subcategoryName: subcategory.name
          })
        })
      })
    })
    return result
  }, [productCategories])

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId)
    setSelectedSubcategory(null)
  }

  const handleSubcategorySelect = (subcategoryId) => {
    setSelectedSubcategory(subcategoryId)
  }

  const handleBackToCategories = () => {
    setSelectedCategory(null)
    setSelectedSubcategory(null)
  }

  const handleBackToSubcategories = () => {
    setSelectedSubcategory(null)
  }

  const handleAddProduct = (product) => {
    setCart(prev => {
      const newCart = { ...prev }
      if (newCart[product.id]) {
        newCart[product.id] = {
          ...newCart[product.id],
          quantity: newCart[product.id].quantity + 1
        }
      } else {
        newCart[product.id] = createCartEntry(product)
      }
      return newCart
    })
  }

  const handleGramsChange = (productId, rawValue) => {
    const digits = String(rawValue).replace(/\D/g, '')
    setCart(prev => {
      const item = prev[productId]
      if (!item) return prev
      const baseGrams = getBaseWeightGrams(item.product)
      if (!baseGrams) return prev

      if (digits === '') {
        return {
          ...prev,
          [productId]: {
            ...item,
            grams: null,
            gramsDraft: '',
            unitPrice: getLineUnitPrice(item.product, baseGrams)
          }
        }
      }

      const grams = parseInt(digits, 10)
      if (!Number.isFinite(grams) || grams <= 0) return prev
      return {
        ...prev,
        [productId]: {
          ...item,
          grams,
          gramsDraft: undefined,
          unitPrice: getLineUnitPrice(item.product, grams)
        }
      }
    })
  }

  const handleGramsBlur = (productId) => {
    setCart(prev => {
      const item = prev[productId]
      if (!item) return prev
      const baseGrams = getBaseWeightGrams(item.product)
      if (!baseGrams) return prev
      const grams = item.grams ?? baseGrams
      if (grams === item.grams && item.gramsDraft === undefined && item.unitPrice === getLineUnitPrice(item.product, grams)) {
        return prev
      }
      return {
        ...prev,
        [productId]: {
          ...item,
          grams,
          gramsDraft: undefined,
          unitPrice: getLineUnitPrice(item.product, grams)
        }
      }
    })
  }

  const handleRemoveProduct = (productId) => {
    setCart(prev => {
      const newCart = { ...prev }
      if (newCart[productId]) {
        if (newCart[productId].quantity > 1) {
          newCart[productId].quantity -= 1
        } else {
          delete newCart[productId]
        }
      }
      return newCart
    })
  }

  // Обновляем родительский компонент через useEffect, чтобы избежать обновления во время рендеринга
  useEffect(() => {
    const total = Object.values(cart).reduce((sum, item) => sum + getCartLineTotal(item), 0)
    if (onProductsChange) {
      onProductsChange(cart, total)
    }
  }, [cart]) // Убираем onProductsChange из зависимостей, чтобы избежать бесконечного цикла

  // Глобальный поиск по всем товарам — хук вызывается всегда (Rules of Hooks)
  const searchTrimmed = productSearchQuery.trim().toLowerCase()
  const globalSearchResults = useMemo(() => {
    if (!searchTrimmed) return []
    return allProductsWithMeta.filter(
      ({ product }) =>
        product.name.toLowerCase().includes(searchTrimmed)
    )
  }, [searchTrimmed, allProductsWithMeta])

  const getCurrentCategory = () => {
    if (!selectedCategory) return null
    return productCategories[selectedCategory]
  }

  const getCurrentSubcategory = () => {
    if (!selectedCategory || !selectedSubcategory) return null
    const category = productCategories[selectedCategory]
    return category?.subcategories[selectedSubcategory]
  }

  const formatSubcategoryName = (name) => {
    // Разделяем название на части: "Группа ЧАЙ: 1000 ГР" -> ["Группа ЧАЙ:", "1000 ГР"]
    if (name.includes(':')) {
      const parts = name.split(':')
      return {
        group: parts[0].trim() + ':',
        weight: parts[1]?.trim() || ''
      }
    }
    // Для подарочных наборов
    if (name.includes('Подарочный')) {
      const match = name.match(/(Подарочный набор.*?)(\d+p?)/i)
      if (match) {
        return {
          group: match[1].trim(),
          weight: match[2].trim()
        }
      }
    }
    return {
      group: name,
      weight: ''
    }
  }

  const cartItems = Object.values(cart)
  const cartTotal = cartItems.reduce((sum, item) => sum + getCartLineTotal(item), 0)

  const renderCartSummary = () => {
    if (cartItems.length === 0) return null
    return (
      <div className="cart-summary">
        <div className="cart-items">
          {cartItems.map(item => {
            const baseGrams = getBaseWeightGrams(item.product)
            const displayGrams = item.gramsDraft !== undefined
              ? item.gramsDraft
              : String(item.grams ?? baseGrams ?? '')
            return (
            <div key={item.product.id} className="cart-item">
              <span className="cart-item-name">{item.product.name}</span>
              {baseGrams != null && (
                <div className="cart-item-grams">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="cart-item-grams-input"
                    value={displayGrams}
                    onChange={(e) => handleGramsChange(item.product.id, e.target.value)}
                    onBlur={() => handleGramsBlur(item.product.id)}
                    aria-label={`Граммовка: ${item.product.name}`}
                  />
                  <span className="cart-item-grams-label">г</span>
                </div>
              )}
              <div className="cart-item-controls">
                <button
                  type="button"
                  className="cart-btn-minus"
                  onClick={() => handleRemoveProduct(item.product.id)}
                >
                  −
                </button>
                <span className="cart-item-quantity">{item.quantity}</span>
                <button
                  type="button"
                  className="cart-btn-plus"
                  onClick={() => handleAddProduct(item.product)}
                >
                  +
                </button>
                <span className="cart-item-price">
                  {getCartLineTotal(item).toFixed(2)} BYN
                </span>
              </div>
            </div>
          )})}
        </div>
        <div className="cart-total">
          Итого: <strong>{cartTotal.toFixed(2)} BYN</strong>
        </div>
      </div>
    )
  }

  // Функция для получения иконки категории: приоритет у icon из БД, иначе по названию, по умолчанию — чашка чая
  const DEFAULT_GROUP_ICON = '/img/tea-cup-svgrepo-com.svg'
  const getCategoryIcon = (categoryId, categoryName, categoryIcon) => {
    if (categoryIcon && categoryIcon.trim()) {
      const trimmed = categoryIcon.trim()
      const isUrl = /^https?:\/\//i.test(trimmed)
      const isLocalPath = trimmed.startsWith('/')
      if (isUrl || isLocalPath) {
        return (
          <img
            src={trimmed}
            alt=""
            style={{ width: '40px', height: '40px' }}
            onError={(e) => {
              e.currentTarget.onerror = null
              e.currentTarget.src = DEFAULT_GROUP_ICON
            }}
          />
        )
      }
      return (
        <span className="category-icon-emoji" aria-hidden="true">{trimmed}</span>
      )
    }
    const name = (categoryName || '').toUpperCase()
    if (name.includes('ЧАЙ') && !name.includes('КАКАО') && !name.includes('НАПИТКИ')) {
      return (
        <img src="/img/tea-cup-svgrepo-com.svg" alt="" style={{ width: '40px', height: '40px' }} />
      )
    }
    if (name.includes('ЧАЙНЫЕ НАПИТКИ') || name.includes('ГОРЯЧИЙ ЧАЙ')) {
      return (
        <img src="/img/tea-cup-svgrepo-com.svg" alt="" style={{ width: '40px', height: '40px' }} />
      )
    }
    if (name.includes('ЧАЙ ФАСОВАННЫЙ') || name.includes('ЧАЙ ЛИСТОВОЙ')) {
      return (
        <img src={DEFAULT_GROUP_ICON} alt="" style={{ width: '40px', height: '40px' }} />
      )
    }
    if (name.includes('КАКАО') || name.includes('ЧАЙ / КАКАО')) {
      return (
        <img src="/img/cocoa-cup-coffee-svgrepo-com.svg" alt="" style={{ width: '40px', height: '40px' }} />
      )
    }
    return (
      <img src={DEFAULT_GROUP_ICON} alt="" style={{ width: '40px', height: '40px' }} />
    )
  }

  if (loadingProducts) {
    return (
      <div className="product-selector">
        <div className="product-selector-loading">Загрузка товаров...</div>
      </div>
    )
  }

  if (productsError) {
    return (
      <div className="product-selector">
        <div className="product-selector-error">{productsError}</div>
      </div>
    )
  }

  // Если категория не выбрана - показываем поиск (главный) и выбор категорий
  if (!selectedCategory) {
    const showSearchResults = searchTrimmed.length > 0
    const mainProductsToShow = showSearchResults ? globalSearchResults.map(({ product }) => product) : []

    return (
      <div className="product-selector">
        <div className="product-search-wrap product-search-wrap-main">
          <input
            type="text"
            className="product-search-input"
            placeholder="Поиск по всем товарам..."
            value={productSearchQuery}
            onChange={(e) => setProductSearchQuery(e.target.value)}
            aria-label="Поиск по всем товарам"
          />
          {productSearchQuery && (
            <button
              type="button"
              className="product-search-clear"
              onClick={() => setProductSearchQuery('')}
              aria-label="Очистить поиск"
            >
              ×
            </button>
          )}
        </div>
        {showSearchResults ? (
          <>
            <p className="product-search-hint">
              Найдено: {globalSearchResults.length} {globalSearchResults.length === 1 ? 'товар' : globalSearchResults.length < 5 ? 'товара' : 'товаров'}
            </p>
            <div className="products-list">
              {mainProductsToShow.map(product => {
                const meta = allProductsWithMeta.find(m => m.product.id === product.id)
                return (
                  <div key={product.id} className="product-item">
                    <div className="product-info" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {product.image_data && (
                        <img 
                          src={product.image_data} 
                          alt={product.name}
                          className="product-image"
                          style={{ 
                            width: '50px', 
                            height: '50px', 
                            objectFit: 'cover', 
                            borderRadius: '4px', 
                            border: '1px solid var(--border)',
                            flexShrink: 0
                          }} 
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="product-name">{product.name}</div>
                        {meta && (
                          <div className="product-meta">{meta.categoryName} → {meta.subcategoryName}</div>
                        )}
                        <div className="product-price">{formatProductPriceLabel(product)}</div>
                      </div>
                    </div>
                    <div className="product-actions">
                      {cart[product.id] ? (
                        <div className="product-quantity-controls">
                          <button type="button" className="product-btn-minus" onClick={() => handleRemoveProduct(product.id)}>−</button>
                          <span className="product-quantity">{cart[product.id].quantity}</span>
                          <button type="button" className="product-btn-plus" onClick={() => handleAddProduct(product)}>+</button>
                        </div>
                      ) : (
                        <button type="button" className="product-btn-add" onClick={() => handleAddProduct(product)}>Добавить</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div className="product-categories">
          {Object.values(productCategories).map(category => (
            <button
              key={category.id}
              type="button"
              className="category-button"
              onClick={() => handleCategorySelect(category.id)}
            >
              <div className="category-icon">
                {getCategoryIcon(category.id, category.name, category.icon)}
              </div>
              <div className="category-label">Группа</div>
              <div className="category-name">{category.name}</div>
            </button>
          ))}
          </div>
        )}
        {renderCartSummary()}
      </div>
    )
  }

  const category = getCurrentCategory()

  // Если подкатегория не выбрана - показываем выбор подкатегорий
  if (!selectedSubcategory) {
    return (
      <div className="product-selector">
        <button
          type="button"
          className="back-button"
          onClick={handleBackToCategories}
        >
          ← Назад к категориям
        </button>
        <h3 className="subcategory-title">{category.name}</h3>
        <div className="subcategories">
          {Object.values(category.subcategories).map(subcategory => {
            const formatted = formatSubcategoryName(subcategory.name)
            return (
              <button
                key={subcategory.id}
                type="button"
                className="subcategory-button"
                onClick={() => handleSubcategorySelect(subcategory.id)}
              >
                <div className="subcategory-content">
                  <span className="subcategory-group">{formatted.group}</span>
                  {formatted.weight && (
                    <span className="subcategory-weight">{formatted.weight}</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
        {renderCartSummary()}
      </div>
    )
  }

  // Показываем товары выбранной подкатегории + глобальный поиск по всем товарам
  const subcategory = getCurrentSubcategory()
  const showGlobalSearch = searchTrimmed.length > 0
  const productsToShow = showGlobalSearch ? globalSearchResults.map(({ product }) => product) : subcategory.products

  return (
    <div className="product-selector">
      <button
        type="button"
        className="back-button"
        onClick={handleBackToSubcategories}
      >
        ← Назад к подкатегориям
      </button>
      <h3 className="products-title">{subcategory.name}</h3>
      <div className="product-search-wrap">
        <input
          type="text"
          className="product-search-input"
          placeholder="Поиск по всем товарам..."
          value={productSearchQuery}
          onChange={(e) => setProductSearchQuery(e.target.value)}
          aria-label="Поиск по всем товарам"
        />
        {productSearchQuery && (
          <button
            type="button"
            className="product-search-clear"
            onClick={() => setProductSearchQuery('')}
            aria-label="Очистить поиск"
          >
            ×
          </button>
        )}
      </div>
      {showGlobalSearch && (
        <p className="product-search-hint">
          Найдено: {globalSearchResults.length} {globalSearchResults.length === 1 ? 'товар' : globalSearchResults.length < 5 ? 'товара' : 'товаров'}
        </p>
      )}
      <div className="products-list">
        {productsToShow.map(product => {
          const meta = showGlobalSearch ? allProductsWithMeta.find(m => m.product.id === product.id) : null
          return (
          <div key={product.id} className="product-item">
            <div className="product-info" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {product.image_data && (
                <img 
                  src={product.image_data} 
                  alt={product.name}
                  className="product-image"
                  style={{ 
                    width: '50px', 
                    height: '50px', 
                    objectFit: 'cover', 
                    borderRadius: '4px', 
                    border: '1px solid var(--border)',
                    flexShrink: 0
                  }} 
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="product-name">{product.name}</div>
                {meta && (
                  <div className="product-meta">{(meta.categoryName)} → {meta.subcategoryName}</div>
                )}
                <div className="product-price">{formatProductPriceLabel(product)}</div>
              </div>
            </div>
            <div className="product-actions">
              {cart[product.id] ? (
                <div className="product-quantity-controls">
                  <button
                    type="button"
                    className="product-btn-minus"
                    onClick={() => handleRemoveProduct(product.id)}
                  >
                    −
                  </button>
                  <span className="product-quantity">{cart[product.id].quantity}</span>
                  <button
                    type="button"
                    className="product-btn-plus"
                    onClick={() => handleAddProduct(product)}
                  >
                    +
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="product-btn-add"
                  onClick={() => handleAddProduct(product)}
                >
                  Добавить
                </button>
              )}
            </div>
          </div>
          )
        })}
      </div>
      {renderCartSummary()}
    </div>
  )
}

export default ProductSelector
