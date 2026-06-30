import React from 'react'
import { APP_VERSION } from '../config/version'
import './Footer.css'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <span className="footer-copyright">© 2026 Tea. Made with ♥️ around the world</span>
        <span className="footer-version">Версия {APP_VERSION}</span>
      </div>
    </footer>
  )
}

export default Footer
