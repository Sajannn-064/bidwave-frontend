import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'

function MyAuctions() {
  const [auctions, setAuctions] = useState([])
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }

    api.get('/api/users/me').then((res) => {
      api.get(`/api/auctions/seller/${res.data.id}`).then((r) => setAuctions(r.data))
    })
  }, [token, navigate])

  const activateAuction = async (auctionId) => {
    try {
      const res = await api.put(`/api/auctions/${auctionId}/status?status=ACTIVE`)
      setAuctions((prev) => prev.map((a) => (a.id === auctionId ? res.data : a)))
    } catch (err) {
      setError('Failed to activate auction')
    }
  }

  if (!token) return null

  return (
    <div className="page">
      <h1>My auctions</h1>
      {error && <p className="error-text">{error}</p>}

      <div className="list-stack">
        {auctions.map((auction) => {
          const badgeClass = `badge badge-${auction.status.toLowerCase()}`
          return (
            <div key={auction.id} className="list-item">
              <div className="lot-label">LOT №{auction.id}</div>
              <h3>{auction.item.name}</h3>
              <div className="price-row">
                <p className="price">${auction.currentPrice}</p>
                <span className={badgeClass}>{auction.status}</span>
              </div>

              <div className="list-item-actions">
                {auction.status === 'PENDING' && (
                  <button onClick={() => activateAuction(auction.id)}>Activate auction</button>
                )}
                <Link to={`/auctions/${auction.id}`}>View auction →</Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MyAuctions