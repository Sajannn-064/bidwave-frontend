import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

function Auctions() {
  const [auctions, setAuctions] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/api/auctions/active')
      .then((response) => setAuctions(response.data))
      .catch(() => setError('Failed to load auctions'))
  }, [])

  return (
    <div className="page">
      <h1>Active auctions</h1>
      {error && <p className="error-text">{error}</p>}

      <div className="auction-grid">
        {auctions.map((auction) => (
          <Link to={`/auctions/${auction.id}`} key={auction.id} className="auction-card">
            <div className="lot-label">LOT №{auction.id}</div>
            <h3>{auction.item.name}</h3>
            <p className="price">${auction.currentPrice}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Ends {new Date(auction.endTime).toLocaleString()}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default Auctions