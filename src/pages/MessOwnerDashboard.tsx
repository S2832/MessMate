import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../lib/firebase'
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore'
import Navbar from '../components/Navbar'
import { Store, Plus, ChefHat, CheckCircle, XCircle, ShoppingBag, ArrowLeft, Clock, History } from 'lucide-react'
import { toast } from 'sonner'

export default function MessOwnerDashboard() {
  const navigate = useNavigate()
  const user = auth.currentUser
  const [mess, setMess] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [menuCount, setMenuCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pending')

  useEffect(() => {
    if (!user) return
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [user])

  const fetchData = async () => {
    if (!user) return
    const messSnap = await getDocs(query(collection(db, 'messes'), where('owner_id', '==', user.uid)))
    if (!messSnap.empty) {
      const messData = { docId: messSnap.docs[0].id, ...messSnap.docs[0].data() }
      setMess(messData)
      const menuSnap = await getDocs(query(collection(db, 'menu_items'), where('mess_id', '==', messSnap.docs[0].id)))
      setMenuCount(menuSnap.size)
      const ordersSnap = await getDocs(query(collection(db, 'orders'), where('mess_id', '==', messSnap.docs[0].id)))
      const allOrders = ordersSnap.docs.map(d => ({ docId: d.id, ...d.data() }))
      allOrders.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setOrders(allOrders)
    }
    setLoading(false)
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    await updateDoc(doc(db, 'orders', orderId), { status })
    toast.success(status === 'confirmed' ? '✅ Order Accepted!' : '❌ Order Rejected!')
    fetchData()
  }

  const pendingOrders = orders.filter(o => o.status === 'pending')
  const confirmedOrders = orders.filter(o => o.status === 'confirmed')
  const rejectedOrders = orders.filter(o => o.status === 'rejected')

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Back Button */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-4 transition">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Store className="text-primary" />Mess Owner Dashboard
        </h1>

        {!mess ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No Mess Registered</h3>
            <p className="text-gray-500 mb-6">Register your mess to start receiving orders!</p>
            <button onClick={() => navigate('/register-mess')} className="bg-primary text-white px-6 py-3 rounded-xl hover:bg-orange-600">
              <Plus className="w-4 h-4 inline mr-2" />Register Your Mess
            </button>
          </div>
        ) : (
          <>
            {/* Mess Info */}
            <div className="bg-white rounded-xl shadow p-6 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">{mess.name}</h2>
                  <p className="text-gray-500">{mess.city} • {mess.cuisine_type}</p>
                  <p className="text-gray-400 text-sm mt-1">{mess.phone}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${mess.is_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {mess.is_approved ? '✅ Approved' : '⏳ Pending Approval'}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow p-4 text-center">
                <div className="text-3xl font-bold text-orange-500">{pendingOrders.length}</div>
                <div className="text-gray-500 text-sm">Pending Orders</div>
              </div>
              <div className="bg-white rounded-xl shadow p-4 text-center">
                <div className="text-3xl font-bold text-green-500">{confirmedOrders.length}</div>
                <div className="text-gray-500 text-sm">Accepted Orders</div>
              </div>
              <div className="bg-white rounded-xl shadow p-4 text-center">
                <div className="text-3xl font-bold text-blue-500">{menuCount}</div>
                <div className="text-gray-500 text-sm">Menu Items</div>
              </div>
              <div className="bg-white rounded-xl shadow p-4 text-center">
                <div className="text-3xl font-bold text-purple-500">₹{confirmedOrders.reduce((a: number, o: any) => a + (o.total || 0), 0)}</div>
                <div className="text-gray-500 text-sm">Total Revenue</div>
              </div>
            </div>

            {/* Manage Menu Button */}
            <button onClick={() => navigate('/manage-menu')} className="w-full bg-primary text-white p-4 rounded-xl hover:bg-orange-600 flex items-center gap-3 mb-6">
              <ChefHat className="w-6 h-6" />
              <div className="text-left">
                <div className="font-bold">Manage Menu</div>
                <div className="text-sm opacity-80">Add, edit, delete menu items</div>
              </div>
            </button>

            {/* Orders Tabs */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex gap-3 mb-6 flex-wrap">
                <button onClick={() => setTab('pending')}
                  className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition ${tab === 'pending' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-orange-50'}`}>
                  <Clock className="w-4 h-4" />Pending ({pendingOrders.length})
                </button>
                <button onClick={() => setTab('confirmed')}
                  className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition ${tab === 'confirmed' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-green-50'}`}>
                  <CheckCircle className="w-4 h-4" />Accepted ({confirmedOrders.length})
                </button>
                <button onClick={() => setTab('rejected')}
                  className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition ${tab === 'rejected' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-red-50'}`}>
                  <XCircle className="w-4 h-4" />Rejected ({rejectedOrders.length})
                </button>
                <button onClick={() => setTab('all')}
                  className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition ${tab === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-blue-50'}`}>
                  <History className="w-4 h-4" />All Orders ({orders.length})
                </button>
              </div>

              {/* Pending Orders */}
              {tab === 'pending' && (
                <div className="space-y-4">
                  {pendingOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No pending orders</p>
                    </div>
                  ) : pendingOrders.map(order => (
                    <div key={order.docId} className="border rounded-xl p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-bold">Order #{order.docId.slice(-6).toUpperCase()}</p>
                          <p className="text-gray-500 text-sm">{new Date(order.created_at).toLocaleDateString('en-IN')} • ₹{order.total}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => updateOrderStatus(order.docId, 'confirmed')}
                            className="flex items-center gap-1 bg-green-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-600">
                            <CheckCircle className="w-4 h-4" />Accept
                          </button>
                          <button onClick={() => updateOrderStatus(order.docId, 'rejected')}
                            className="flex items-center gap-1 bg-red-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-600">
                            <XCircle className="w-4 h-4" />Reject
                          </button>
                        </div>
                      </div>
                      {order.items && (
                        <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                          {order.items.map((item: any, i: number) => (
                            <span key={i}>{item.name} x{item.quantity}{i < order.items.length-1 ? ' • ' : ''}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Confirmed Orders */}
              {tab === 'confirmed' && (
                <div className="space-y-3">
                  {confirmedOrders.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No accepted orders yet</p>
                  ) : confirmedOrders.map(order => (
                    <div key={order.docId} className="border border-green-200 bg-green-50 rounded-xl p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold">Order #{order.docId.slice(-6).toUpperCase()}</p>
                          <p className="text-gray-500 text-sm">{new Date(order.created_at).toLocaleDateString('en-IN')}</p>
                          {order.items && <p className="text-sm text-gray-500 mt-1">{order.items.map((i: any) => `${i.name} x${i.quantity}`).join(' • ')}</p>}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">₹{order.total}</p>
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">✅ Accepted</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Rejected Orders */}
              {tab === 'rejected' && (
                <div className="space-y-3">
                  {rejectedOrders.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No rejected orders</p>
                  ) : rejectedOrders.map(order => (
                    <div key={order.docId} className="border border-red-200 bg-red-50 rounded-xl p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold">Order #{order.docId.slice(-6).toUpperCase()}</p>
                          <p className="text-gray-500 text-sm">{new Date(order.created_at).toLocaleDateString('en-IN')}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600">₹{order.total}</p>
                          <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">❌ Rejected</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* All Orders */}
              {tab === 'all' && (
                <div className="space-y-3">
                  {orders.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No orders yet</p>
                  ) : orders.map(order => (
                    <div key={order.docId} className="border rounded-xl p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold">Order #{order.docId.slice(-6).toUpperCase()}</p>
                          <p className="text-gray-500 text-sm">{new Date(order.created_at).toLocaleDateString('en-IN')}</p>
                          {order.items && <p className="text-sm text-gray-500 mt-1">{order.items.map((i: any) => `${i.name} x${i.quantity}`).join(' • ')}</p>}
                        </div>
                        <div className="text-right">
                          <p className="font-bold">₹{order.total}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'confirmed' ? 'bg-green-100 text-green-700' : order.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {order.status === 'confirmed' ? '✅ Accepted' : order.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}