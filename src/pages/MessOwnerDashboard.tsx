import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../lib/firebase'
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore'
import Navbar from '../components/Navbar'
import { Store, Plus, ChefHat, CheckCircle, XCircle, Clock, History, Download } from 'lucide-react'
import { toast } from 'sonner'

export default function MessOwnerDashboard() {
  const navigate = useNavigate()
  const user = auth.currentUser
  const [mess, setMess] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [menuCount, setMenuCount] = useState(0)
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pending')

  useEffect(() => {
    if (!user) return
    fetchData()
    const interval = setInterval(fetchData, 15000)
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
      setMenuItems(menuSnap.docs.map(d => ({ docId: d.id, ...d.data() })))
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

  const downloadPDF = () => {
    if (!mess) return
    const confirmedOrders = orders.filter(o => o.status === 'confirmed')
    const totalRevenue = confirmedOrders.reduce((sum, o: any) => sum + (Number(o.total) || 0), 0)

    // Popular items analysis
    const itemCount: Record<string, number> = {}
    orders.forEach((o: any) => {
      if (o.items) {
        o.items.forEach((item: any) => {
          itemCount[item.name] = (itemCount[item.name] || 0) + (item.quantity || 1)
        })
      }
    })
    const popularItems = Object.entries(itemCount).sort(([,a],[,b]) => b-a).slice(0, 5)

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${mess.name} - Business Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 30px; color: #333; }
          h1 { color: #E85D04; border-bottom: 3px solid #E85D04; padding-bottom: 10px; }
          h2 { color: #333; margin-top: 25px; }
          .stats { display: flex; gap: 15px; margin: 20px 0; flex-wrap: wrap; }
          .stat-box { background: #FFF3E0; border: 2px solid #E85D04; border-radius: 8px; padding: 15px 20px; text-align: center; min-width: 120px; }
          .stat-number { font-size: 28px; font-weight: bold; color: #E85D04; }
          .stat-label { font-size: 12px; color: #666; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th { background: #E85D04; color: white; padding: 10px; text-align: left; font-size: 13px; }
          td { padding: 8px 10px; border-bottom: 1px solid #eee; font-size: 13px; }
          tr:nth-child(even) { background: #FFF8F0; }
          .confirmed { color: green; font-weight: bold; }
          .pending { color: orange; font-weight: bold; }
          .rejected { color: red; font-weight: bold; }
          .footer { margin-top: 40px; text-align: center; color: #999; font-size: 11px; border-top: 1px solid #eee; padding-top: 15px; }
          .mess-info { background: #FFF3E0; padding: 15px; border-radius: 8px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <h1>🍽️ ${mess.name} - Business Report</h1>
        <p>Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        
        <div class="mess-info">
          <strong>Mess Details:</strong> ${mess.name} | ${mess.city} | ${mess.cuisine_type} | ${mess.phone}
          <br>Status: ${mess.is_approved ? '✅ Approved & Live' : '⏳ Pending Approval'}
        </div>

        <div class="stats">
          <div class="stat-box"><div class="stat-number">${orders.length}</div><div class="stat-label">Total Orders</div></div>
          <div class="stat-box"><div class="stat-number">${confirmedOrders.length}</div><div class="stat-label">Confirmed</div></div>
          <div class="stat-box"><div class="stat-number">${orders.filter(o=>o.status==='pending').length}</div><div class="stat-label">Pending</div></div>
          <div class="stat-box"><div class="stat-number">${orders.filter(o=>o.status==='rejected').length}</div><div class="stat-label">Rejected</div></div>
          <div class="stat-box"><div class="stat-number">₹${totalRevenue}</div><div class="stat-label">Total Revenue</div></div>
          <div class="stat-box"><div class="stat-number">${menuCount}</div><div class="stat-label">Menu Items</div></div>
        </div>

        ${popularItems.length > 0 ? `
        <h2>🔥 Popular Menu Items</h2>
        <table>
          <tr><th>Item Name</th><th>Times Ordered</th></tr>
          ${popularItems.map(([name, count]) => `<tr><td>${name}</td><td>${count} times</td></tr>`).join('')}
        </table>` : ''}

        <h2>📦 Order History</h2>
        <table>
          <tr><th>Date</th><th>Items</th><th>Amount</th><th>Payment</th><th>Status</th></tr>
          ${orders.map((o: any) => `
            <tr>
              <td>${o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN') : '-'}</td>
              <td>${o.items ? o.items.map((i:any) => `${i.name} x${i.quantity}`).join(', ') : '-'}</td>
              <td>₹${o.total || 0}</td>
              <td>${o.payment_method || '-'}</td>
              <td class="${o.status}">${o.status === 'confirmed' ? '✅ Confirmed' : o.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}</td>
            </tr>
          `).join('')}
        </table>

        <h2>🍽️ Menu Items</h2>
        <table>
          <tr><th>Item Name</th><th>Category</th><th>Price</th><th>Type</th><th>Available</th></tr>
          ${menuItems.map((item: any) => `
            <tr>
              <td>${item.name}</td>
              <td>${item.category || '-'}</td>
              <td>₹${item.price}</td>
              <td>${item.is_vegetarian ? '🟢 Veg' : '🔴 Non-Veg'}</td>
              <td>${item.is_available ? '✅ Yes' : '❌ No'}</td>
            </tr>
          `).join('')}
        </table>

        <div class="footer">
          <p>${mess.name} | MessMate Platform | mess-mate-psi.vercel.app</p>
        </div>
      </body>
      </html>
    `

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${mess.name}_Report_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.html`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Report downloaded! Open in browser → Print → Save as PDF')
  }

  const pendingOrders = orders.filter(o => o.status === 'pending')
  const confirmedOrders = orders.filter(o => o.status === 'confirmed')
  const rejectedOrders = orders.filter(o => o.status === 'rejected')
  const totalRevenue = confirmedOrders.reduce((sum, o: any) => sum + (Number(o.total) || 0), 0)

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2"><Store className="text-primary" />Mess Owner Dashboard</h1>
          {mess && (
            <button onClick={downloadPDF} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition">
              <Download className="w-4 h-4" /> Download Report
            </button>
          )}
        </div>

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
            <div className="bg-white rounded-xl shadow p-6 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">{mess.name}</h2>
                  <p className="text-gray-500">{mess.city} • {mess.cuisine_type} • {mess.phone}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${mess.is_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {mess.is_approved ? '✅ Approved' : '⏳ Pending Approval'}
                </span>
              </div>
            </div>

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
                <div className="text-3xl font-bold text-purple-500">₹{totalRevenue}</div>
                <div className="text-gray-500 text-sm">Total Revenue</div>
              </div>
            </div>

            <button onClick={() => navigate('/manage-menu')} className="w-full bg-primary text-white p-4 rounded-xl hover:bg-orange-600 flex items-center gap-3 mb-6">
              <ChefHat className="w-6 h-6" />
              <div className="text-left"><div className="font-bold">Manage Menu</div><div className="text-sm opacity-80">Add, edit, delete menu items</div></div>
            </button>

            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex gap-3 mb-6 flex-wrap">
                {[
                  { key: 'pending', label: `Pending (${pendingOrders.length})`, icon: Clock, color: 'orange' },
                  { key: 'confirmed', label: `Accepted (${confirmedOrders.length})`, icon: CheckCircle, color: 'green' },
                  { key: 'rejected', label: `Rejected (${rejectedOrders.length})`, icon: XCircle, color: 'red' },
                  { key: 'all', label: `All (${orders.length})`, icon: History, color: 'blue' },
                ].map(t => (
                  <button key={t.key} onClick={() => setTab(t.key)}
                    className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition ${tab === t.key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-orange-50'}`}>
                    <t.icon className="w-4 h-4" />{t.label}
                  </button>
                ))}
              </div>

              {tab === 'pending' && (
                <div className="space-y-4">
                  {pendingOrders.length === 0 ? <p className="text-center text-gray-500 py-8">No pending orders</p>
                    : pendingOrders.map(order => (
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
                        {order.items && <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">{order.items.map((item: any) => `${item.name} x${item.quantity}`).join(' • ')}</div>}
                      </div>
                    ))}
                </div>
              )}

              {tab === 'confirmed' && (
                <div className="space-y-3">
                  {confirmedOrders.length === 0 ? <p className="text-center text-gray-500 py-8">No accepted orders yet</p>
                    : confirmedOrders.map(order => (
                      <div key={order.docId} className="border border-green-200 bg-green-50 rounded-xl p-4 flex justify-between">
                        <div>
                          <p className="font-bold">Order #{order.docId.slice(-6).toUpperCase()}</p>
                          <p className="text-gray-500 text-sm">{new Date(order.created_at).toLocaleDateString('en-IN')}</p>
                          {order.items && <p className="text-sm text-gray-500">{order.items.map((i: any) => `${i.name} x${i.quantity}`).join(' • ')}</p>}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">₹{order.total}</p>
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">✅ Accepted</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {tab === 'rejected' && (
                <div className="space-y-3">
                  {rejectedOrders.length === 0 ? <p className="text-center text-gray-500 py-8">No rejected orders</p>
                    : rejectedOrders.map(order => (
                      <div key={order.docId} className="border border-red-200 bg-red-50 rounded-xl p-4 flex justify-between">
                        <div>
                          <p className="font-bold">Order #{order.docId.slice(-6).toUpperCase()}</p>
                          <p className="text-gray-500 text-sm">{new Date(order.created_at).toLocaleDateString('en-IN')}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600">₹{order.total}</p>
                          <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">❌ Rejected</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {tab === 'all' && (
                <div className="space-y-3">
                  {orders.length === 0 ? <p className="text-center text-gray-500 py-8">No orders yet</p>
                    : orders.map(order => (
                      <div key={order.docId} className="border rounded-xl p-4 flex justify-between">
                        <div>
                          <p className="font-bold">Order #{order.docId.slice(-6).toUpperCase()}</p>
                          <p className="text-gray-500 text-sm">{new Date(order.created_at).toLocaleDateString('en-IN')}</p>
                          {order.items && <p className="text-sm text-gray-500">{order.items.map((i: any) => `${i.name} x${i.quantity}`).join(' • ')}</p>}
                        </div>
                        <div className="text-right">
                          <p className="font-bold">₹{order.total}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'confirmed' ? 'bg-green-100 text-green-700' : order.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {order.status === 'confirmed' ? '✅ Accepted' : order.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                          </span>
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