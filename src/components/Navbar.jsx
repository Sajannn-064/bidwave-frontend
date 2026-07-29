import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'))
  const navigate = useNavigate()

  useEffect(() => {
    const checkLogin = () => setIsLoggedIn(!!localStorage.getItem('token'))
    window.addEventListener('authChange', checkLogin)
    return () => window.removeEventListener('authChange', checkLogin)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    window.dispatchEvent(new Event('authChange'))
    navigate('/')
  }

  return (
    <nav className="navbar">
      <Link to="/" className="brand">BidWave</Link>
      <div className="navbar-links">
        {isLoggedIn ? (
          <>
            <Link to="/create-item">List Item</Link>
            <Link to="/my-items">My Items</Link>
            <Link to="/my-auctions">My Auctions</Link>
            <Link to="/create-auction">Create Auction</Link>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar