import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Auctions from './pages/Auctions'
import AuctionDetail from './pages/AuctionDetail'
import CreateItem from './pages/CreateItem'
import CreateAuction from './pages/CreateAuction'
import MyItems from './pages/MyItems'
import MyAuctions from './pages/MyAuctions'

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Auctions />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auctions/:id" element={<AuctionDetail />} />
        <Route path="/create-item" element={<CreateItem />} />
        <Route path="/create-auction" element={<CreateAuction />} />
        <Route path="/my-items" element={<MyItems />} />
        <Route path="/my-auctions" element={<MyAuctions />} />
      </Routes>
    </>
  )
}

export default App