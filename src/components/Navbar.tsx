import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { auth, db } from '../lib/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { Utensils, LogOut, User, Menu, X } from 'lucide-react'
import { toast } from 'sonner'

export default function Navbar() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        const roleDoc = await getDoc(doc(db, 'user_roles', u.uid))
        if (roleDoc.exists()) setRole(roleDoc.data().role)
      } else {
        setRole('')
      }
    })
    return unsub
  }, [])

  const handleSignOut = async () => {
    await signOut(auth)
    toast.success('Signed out successfully')
    navigate('/')
  }

  const getDashboardLink = () => {
    if (role === 'admin') return '/admin'
    if (role === 'mess_owner') return '/mess-owner'
    return '/dashboard'
  }

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-primary rounded-xl w-10 h-10 flex items-center justify-center">
            <Utensils className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-xl text-primary">MessMate</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/messes" className="text-gray-600 hover:text-primary font-medium">Browse Messes</Link>
          {user ? (
            <>
              <Link to={getDashboardLink()} className="flex items-center gap-1 text-gray-600 hover:text-primary">
                <User className="w-4 h-4" />
                Dashboard
              </Link>
              <button onClick={handleSignOut} className="flex items-center gap-1 text-red-500 hover:text-red-600">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          ) : (
            <Link to="/auth" className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-orange-600">
              Login / Sign Up
            </Link>
          )}
        </div>

        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t px-4 py-4 space-y-3">
          <Link to="/messes" className="block text-gray-600" onClick={() => setMenuOpen(false)}>Browse Messes</Link>
          {user ? (
            <>
              <Link to={getDashboardLink()} className="block text-gray-600" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <button onClick={handleSignOut} className="block text-red-500">Logout</button>
            </>
          ) : (
            <Link to="/auth" className="block bg-primary text-white px-4 py-2 rounded-lg text-center" onClick={() => setMenuOpen(false)}>Login / Sign Up</Link>
          )}
        </div>
      )}
    </nav>
  )
}
