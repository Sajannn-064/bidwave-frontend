import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

function CreateItem() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  useEffect(() => {
    if (!token) navigate('/login')
  }, [token, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const me = await api.get('/api/users/me')
      await api.post('/api/items', { name, description, imageUrl: null, sellerId: me.data.id })
      navigate('/')
    } catch (err) {
      setError('Failed to create item. Please make sure you are logged in and try again.')
    }
  }

  if (!token) return null

  return (
    <div className="page">
      <h1>List an item</h1>
      {error && <p className="error-text">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <button type="submit">Create</button>
      </form>
    </div>
  )
}

export default CreateItem