import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useEffect, useState } from 'react'
import { auth } from './lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'

// Pages
import Home from './pages/Home'
import Auth from './pages/Auth'
import CustomerDashboard from './pages/CustomerDashboard'
import MessOwnerDashboard from './pages/MessOwnerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import MessList from './pages/MessList'
import MessDetail from './pages/MessDetail'
import RegisterMess from './pages/RegisterMess'
import ManageMenu from './pages/ManageMenu'
import Checkout from './pages/Checkout'
import MyOrders from './pages/MyOrders'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(undefined)
  
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    return unsub
  }, [])

  if (user === undefined) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>
  if (!user) return <Navigate to="/auth" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/messes" element={<MessList />} />
        <Route path="/mess/:id" element={<MessDetail />} />
        <Route path="/dashboard" element={<ProtectedRoute><CustomerDashboard /></ProtectedRoute>} />
        <Route path="/mess-owner" element={<ProtectedRoute><MessOwnerDashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/register-mess" element={<ProtectedRoute><RegisterMess /></ProtectedRoute>} />
        <Route path="/manage-menu" element={<ProtectedRoute><ManageMenu /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
