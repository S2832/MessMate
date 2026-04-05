import { useEffect, useState } from 'react'
import { auth, db } from '../lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import Navbar from '../components/Navbar'
import { ShoppingBag } from 'lucide-react'

export default function MyOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      if (!auth.currentUser) return
      const snap = await getDocs(query(collection(db, 'orders'), where('user_id', '==', auth.currentUser.uid)))
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      all.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setOrders(all)
      setLoading(false)
    }
    fetchOrders()
  }, [])

  const statusColor = (status: string) => {
    if (status === 'confirmed') return 'bg-green-100 text-green-700'
    if (status === 'rejected') return 'bg-red-100 text-red-700'
    return 'bg-yellow-100 text-yellow-700'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><ShoppingBag className="text-primary" />My Orders</h1>
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="bg-white rounded-xl shadow h-24 animate-pulse"></div>)}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-500">No orders yet</h3>
            <p className="text-gray-400 mt-2">Place your first order!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{order.mess_name}</h3>
                    <p className="text-gray-500 text-sm">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor(order.status)}`}>
                    {order.status === 'confirmed' ? '✅ Confirmed' : order.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                  </span>
                </div>
                {order.items && (
                  <div className="text-sm text-gray-500 mb-3">
                    {order.items.map((item: any) => `${item.name} x${item.quantity}`).join(' • ')}
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Via {order.payment_method}</span>
                  <span className="font-bold text-primary text-lg">₹{order.total}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
