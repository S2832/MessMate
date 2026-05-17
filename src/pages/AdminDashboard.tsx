import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import Navbar from '../components/Navbar'
import { Shield, CheckCircle, XCircle, Store, Download } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminDashboard() {
  const [messes, setMesses] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [tab, setTab] = useState('pending')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const messSnap = await getDocs(collection(db, 'messes'))
    setMesses(messSnap.docs.map(d => ({ docId: d.id, ...d.data() })))
    const userSnap = await getDocs(collection(db, 'profiles'))
    setUsers(userSnap.docs.map(d => ({ docId: d.id, ...d.data() })))
    const orderSnap = await getDocs(collection(db, 'orders'))
    setOrders(orderSnap.docs.map(d => ({ docId: d.id, ...d.data() })))
  }

  const approveMess = async (docId: string) => {
    await updateDoc(doc(db, 'messes', docId), { is_approved: true })
    toast.success('✅ Mess Approved!')
    fetchData()
  }

  const rejectMess = async (docId: string) => {
    await updateDoc(doc(db, 'messes', docId), { is_approved: false })
    toast.error('Mess Rejected')
    fetchData()
  }

  // PDF Download for Admin
  const downloadAdminPDF = () => {
    const totalRevenue = orders
      .filter((o: any) => o.status === 'confirmed')
      .reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0)

    const messStats = messes.map((mess: any) => {
      const messOrders = orders.filter((o: any) => o.mess_id === mess.docId)
      const confirmedOrders = messOrders.filter((o: any) => o.status === 'confirmed')
      const revenue = confirmedOrders.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0)
      return { ...mess, totalOrders: messOrders.length, confirmedOrders: confirmedOrders.length, revenue }
    })

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>MessMate Admin Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 30px; color: #333; }
          h1 { color: #E85D04; border-bottom: 3px solid #E85D04; padding-bottom: 10px; }
          h2 { color: #333; margin-top: 30px; }
          .stats { display: flex; gap: 20px; margin: 20px 0; }
          .stat-box { background: #FFF3E0; border: 2px solid #E85D04; border-radius: 8px; padding: 15px 25px; text-align: center; }
          .stat-number { font-size: 32px; font-weight: bold; color: #E85D04; }
          .stat-label { font-size: 14px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th { background: #E85D04; color: white; padding: 10px; text-align: left; }
          td { padding: 8px 10px; border-bottom: 1px solid #eee; }
          tr:nth-child(even) { background: #FFF8F0; }
          .approved { color: green; font-weight: bold; }
          .pending { color: orange; font-weight: bold; }
          .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>🍽️ MessMate - Admin Report</h1>
        <p>Generated on: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        
        <div class="stats">
          <div class="stat-box">
            <div class="stat-number">${messes.length}</div>
            <div class="stat-label">Total Messes</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${messes.filter((m: any) => m.is_approved).length}</div>
            <div class="stat-label">Approved Messes</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${orders.length}</div>
            <div class="stat-label">Total Orders</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">₹${totalRevenue}</div>
            <div class="stat-label">Total Revenue</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${users.length}</div>
            <div class="stat-label">Total Users</div>
          </div>
        </div>

        <h2>📊 Mess-wise Order & Revenue Report</h2>
        <table>
          <tr>
            <th>Mess Name</th>
            <th>City</th>
            <th>Cuisine</th>
            <th>Status</th>
            <th>Total Orders</th>
            <th>Confirmed</th>
            <th>Revenue (₹)</th>
          </tr>
          ${messStats.map((m: any) => `
            <tr>
              <td>${m.name || '-'}</td>
              <td>${m.city || '-'}</td>
              <td>${m.cuisine_type || '-'}</td>
              <td class="${m.is_approved ? 'approved' : 'pending'}">${m.is_approved ? '✅ Approved' : '⏳ Pending'}</td>
              <td>${m.totalOrders}</td>
              <td>${m.confirmedOrders}</td>
              <td>₹${m.revenue}</td>
            </tr>
          `).join('')}
        </table>

        <h2>👥 User Summary</h2>
        <table>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>City</th>
            <th>Role</th>
          </tr>
          ${users.map((u: any) => `
            <tr>
              <td>${u.name || '-'}</td>
              <td>${u.email || '-'}</td>
              <td>${u.city || '-'}</td>
              <td>${u.role || 'customer'}</td>
            </tr>
          `).join('')}
        </table>

        <h2>📦 Recent Orders</h2>
        <table>
          <tr>
            <th>Order ID</th>
            <th>Mess Name</th>
            <th>Total (₹)</th>
            <th>Payment</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
          ${orders.slice(0, 20).map((o: any) => `
            <tr>
              <td>${o.order_id || o.docId?.slice(-6) || '-'}</td>
              <td>${o.mess_name || '-'}</td>
              <td>₹${o.total || 0}</td>
              <td>${o.payment_method || '-'}</td>
              <td>${o.status || '-'}</td>
              <td>${o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN') : '-'}</td>
            </tr>
          `).join('')}
        </table>

        <div class="footer">
          <p>MessMate Platform Report | mess-mate-psi.vercel.app | Generated automatically</p>
        </div>
      </body>
      </html>
    `

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `MessMate_Admin_Report_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.html`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Report downloaded! Open in browser and Print → Save as PDF')
  }

  const pending = messes.filter(m => !m.is_approved)
  const approved = messes.filter(m => m.is_approved)
  const totalRevenue = orders.filter((o: any) => o.status === 'confirmed').reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="text-primary" /> Admin Dashboard
          </h1>
          <button onClick={downloadAdminPDF}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition">
            <Download className="w-4 h-4" /> Download Report
          </button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-3xl font-bold text-gray-700">{messes.length}</div>
            <div className="text-gray-500 text-sm">Total Messes</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-3xl font-bold text-green-500">{approved.length}</div>
            <div className="text-gray-500 text-sm">Approved</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-3xl font-bold text-red-500">{pending.length}</div>
            <div className="text-gray-500 text-sm">Pending</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-3xl font-bold text-blue-500">{users.length}</div>
            <div className="text-gray-500 text-sm">Total Users</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-3xl font-bold text-purple-500">₹{totalRevenue}</div>
            <div className="text-gray-500 text-sm">Total Revenue</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          {['pending', 'all', 'users', 'orders'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition ${tab === t ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-orange-50 shadow'}`}>
              {t === 'pending' ? `Pending (${pending.length})` : t === 'all' ? 'All Messes' : t === 'users' ? 'Users' : 'Orders'}
            </button>
          ))}
        </div>

        {/* Pending Tab */}
        {tab === 'pending' && (
          <div className="space-y-4">
            {pending.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-gray-500">No pending approvals! 🎉</p>
              </div>
            ) : pending.map(mess => (
              <div key={mess.docId} className="bg-white rounded-xl shadow p-6 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg">{mess.name}</h3>
                  <p className="text-gray-500">{mess.city} • {mess.cuisine_type}</p>
                  <p className="text-gray-400 text-sm">{mess.phone} • {mess.address}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => approveMess(mess.docId)}
                    className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button onClick={() => rejectMess(mess.docId)}
                    className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* All Messes */}
        {tab === 'all' && (
          <div className="space-y-3">
            {messes.map(mess => {
              const messOrders = orders.filter((o: any) => o.mess_id === mess.docId)
              const revenue = messOrders.filter((o: any) => o.status === 'confirmed').reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0)
              return (
                <div key={mess.docId} className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">{mess.name}</h3>
                    <p className="text-gray-500 text-sm">{mess.city} • {mess.cuisine_type}</p>
                    <p className="text-gray-400 text-sm">Orders: {messOrders.length} | Revenue: ₹{revenue}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${mess.is_approved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {mess.is_approved ? 'Approved' : 'Pending'}
                    </span>
                    {mess.is_approved
                      ? <button onClick={() => rejectMess(mess.docId)} className="text-red-500 text-sm hover:underline">Reject</button>
                      : <button onClick={() => approveMess(mess.docId)} className="text-green-500 text-sm hover:underline">Approve</button>
                    }
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <div className="space-y-3">
            {users.map(user => (
              <div key={user.docId} className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold">{user.name}</h3>
                  <p className="text-gray-500 text-sm">{user.email} • {user.city}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : user.role === 'mess_owner' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                  {user.role}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Orders Tab */}
        {tab === 'orders' && (
          <div className="space-y-3">
            {orders.map(order => (
              <div key={order.docId} className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold">{order.mess_name}</h3>
                  <p className="text-gray-500 text-sm">{new Date(order.created_at).toLocaleDateString('en-IN')} • {order.payment_method}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">₹{order.total}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'confirmed' ? 'bg-green-100 text-green-700' : order.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}