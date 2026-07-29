import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'

function MyItems() {
  const [items, setItems] = useState([])
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }

    api.get('/api/users/me').then((res) => {
      api.get(`/api/items/seller/${res.data.id}`).then((r) => setItems(r.data))
    })
  }, [token, navigate])

  if (!token) return null

  return (
    <div className="page">
      <h1>My items</h1>

      <div className="list-stack">
        {items.map((item) => (
          <div key={item.id} className="list-item">
            <h3>{item.name}</h3>
            <p className="muted">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="list-item-actions">
        <Link to="/my-auctions">View my auctions →</Link>
      </div>
    </div>
  )
}

export default MyItems