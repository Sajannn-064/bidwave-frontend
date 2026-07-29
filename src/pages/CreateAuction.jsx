import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

function CreateAuction() {
  const [items, setItems] = useState([])
  const [itemId, setItemId] = useState('')
  const [startPrice, setStartPrice] = useState('')
  const [endTime, setEndTime] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }

    api.get('/api/users/me').then((res) => {
      const sellerId = res.data.id
      api.get(`/api/items/seller/${sellerId}`).then((itemsRes) => setItems(itemsRes.data))
    })
  }, [token, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!itemId) {
      setError('Please select an item')
      return
    }

    try {
      const me = await api.get('/api/users/me')

      const now = new Date()
      const startTime = now.toISOString().slice(0, 19)

      await api.post('/api/auctions', {
        itemId: Number(itemId),
        sellerId: me.data.id,
        startPrice: Number(startPrice),
        startTime,
        endTime: endTime + ':00',
      })

      navigate('/')
    } catch (err) {
      setError(err.response?.data || 'Failed to create auction')
    }
  }

  if (!token) return null

  return (
    <div className="page page-center">
      <h1>Create auction</h1>
      {error && <p className="error-text">{error}</p>}
      <form onSubmit={handleSubmit}>
        <select value={itemId} onChange={(e) => setItemId(e.target.value)}>
          <option value="">Select an item</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Starting price"
          value={startPrice}
          onChange={(e) => setStartPrice(e.target.value)}
        />

        <input
          type="datetime-local"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />

        <button type="submit">Create auction</button>
      </form>
    </div>
  )
}

export default CreateAuction