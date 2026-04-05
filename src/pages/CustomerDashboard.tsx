import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../lib/firebase'
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore'
import Navbar from '../components/Navbar'
import { Utensils, ShoppingBag, User, Phone, MapPin, Mail } from 'lucide-react'

export default function CustomerDashboard() {
  const navigate = useNavigate()
  const user = auth.currentUser
  const [orders, setOrders] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [tab, setTab] = useState('home')

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      const snap = await getDocs(query(collection(db, 'orders'), where('user_id', '==', user.uid)))
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      all.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setOrders(all)
      const profileDoc = await getDoc(doc(db, 'profiles', user.uid))
      if (profileDoc.exists()) setProfile(profileDoc.data())
    }
    fetchData()
  }, [user])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Welcome, {user?.displayName || 'Customer'}! 👋</h1>
        <p className="text-gray-500 mb-6">Find your favorite mess and order delicious food</p>

        {/* Tabs */}
        <div className="flex gap-3 mb-6">
          {['home', 'orders', 'profile'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition ${tab === t ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-orange-50 shadow'}`}>
              {t === 'home' ? '🏠 Home' : t === 'orders' ? `📦 Orders (${orders.length})` : '👤 Profile'}
            </button>
          ))}
        </div>

        {/* Home Tab */}
        {tab === 'home' && (
          <div className="grid md:grid-cols-3 gap-6">
            <div onClick={() => navigate('/messes')} className="bg-white rounded-xl shadow p-6 cursor-pointer hover:shadow-lg transition border-l-4 border-primary">
              <Utensils className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-bold text-lg">Browse Messes</h3>
              <p className="text-gray-500 text-sm">Find local messes and tiffin services</p>
            </div>
            <div onClick={() => setTab('orders')} className="bg-white rounded-xl shadow p-6 cursor-pointer hover:shadow-lg transition border-l-4 border-blue-500">
              <ShoppingBag className="w-8 h-8 text-blue-500 mb-3" />
              <h3 className="font-bold text-lg">My Orders</h3>
              <p className="text-gray-500 text-sm">{orders.length} orders placed</p>
            </div>
            <div onClick={() => setTab('profile')} className="bg-white rounded-xl shadow p-6 cursor-pointer hover:shadow-lg transition border-l-4 border-green-500">
              <User className="w-8 h-8 text-green-500 mb-3" />
              <h3 className="font-bold text-lg">My Profile</h3>
              <p className="text-gray-500 text-sm">View and manage your profile</p>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {tab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-12 text-center">
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-500">No orders yet</h3>
                <button onClick={() => navigate('/messes')} className="mt-4 bg-primary text-white px-6 py-2 rounded-lg hover:bg-orange-600">Browse Messes</button>
              </div>
            ) : orders.map(order => (
              <div key={order.id} className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{order.mess_name}</h3>
                    <p className="text-gray-500 text-sm">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${order.status === 'confirmed' ? 'bg-green-100 text-green-700' : order.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {order.status === 'confirmed' ? '✅ Confirmed' : order.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                  </span>
                </div>
                {order.items && <p className="text-sm text-gray-500 mb-3">{order.items.map((i: any) => `${i.name} x${i.quantity}`).join(' • ')}</p>}
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Via {order.payment_method}</span>
                  <span className="font-bold text-primary">₹{order.total}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div className="bg-white rounded-xl shadow p-8 max-w-lg">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><User className="text-primary" />My Profile</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-gray-400">Full Name</p>
                  <p className="font-medium">{profile?.name || user?.displayName || 'Not set'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="font-medium">{profile?.phone || 'Not set'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-gray-400">City</p>
                  <p className="font-medium">{profile?.city || 'Not set'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-gray-400">Account Type</p>
                  <p className="font-medium capitalize">{profile?.role || 'Customer'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}