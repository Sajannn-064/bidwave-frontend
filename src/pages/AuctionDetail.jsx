import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import api from '../api/axios'

function AuctionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [auction, setAuction] = useState(null)
  const [bids, setBids] = useState([])
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [currentUserId, setCurrentUserId] = useState(null)
  const stompClient = useRef(null)
  const token = localStorage.getItem('token')

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }

    api.get(`/api/auctions/${id}`).then((res) => setAuction(res.data))
    api.get(`/api/bids/auction/${id}`).then((res) => setBids(res.data))
    api.get('/api/users/me').then((res) => setCurrentUserId(res.data.id))

    const socket = new SockJS(`${import.meta.env.VITE_API_URL}/ws?token=${token}`)
    const client = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        client.subscribe(`/topic/auction.${id}`, (message) => {
          const newBid = JSON.parse(message.body)
          setBids((prev) => [newBid, ...prev])
          setAuction((prev) => ({ ...prev, currentPrice: newBid.amount }))
        })

        client.subscribe('/user/queue/errors', (message) => {
          setError(message.body)
        })
      },
    })
    client.activate()
    stompClient.current = client

    return () => client.deactivate()
  }, [id, token, navigate])

  const placeBid = () => {
    if (!stompClient.current || !amount) return
    stompClient.current.publish({
      destination: '/app/bid.place',
      body: JSON.stringify({ auctionId: Number(id), bidderId: null, amount: Number(amount) }),
    })
    setAmount('')
    setError('')
  }

  if (!token) return null
  if (!auction) return <p className="page">Loading...</p>

  const isSeller = currentUserId === auction.seller.id
  const badgeClass = `badge badge-${auction.status.toLowerCase()}`

  return (
    <div className="page">
      <div className="lot-label">LOT №{auction.id}</div>
      <h1>{auction.item.name}</h1>
      <p className="detail-header">{auction.item.description}</p>

      <div className="price-row">
        <p className="price">${auction.currentPrice}</p>
        <span className={badgeClass}>{auction.status}</span>
      </div>

      {auction.status === 'ACTIVE' && !isSeller && (
        <div className="bid-form-row">
          <input
            type="number"
            placeholder="Your bid"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button onClick={placeBid} className="btn-live">Place bid</button>
        </div>
      )}
      {error && <p className="error-text">{error}</p>}

      <h3 className="section-title">Bid history</h3>
      <div className="bid-history">
        {bids.length === 0 && <p className="muted">No bids yet.</p>}
        {bids.map((bid) => (
          <p key={bid.id}>
            <strong className="bid-bidder">{bid.bidder.username}</strong> bid ${bid.amount}
          </p>
        ))}
      </div>
    </div>
  )
}

export default AuctionDetail