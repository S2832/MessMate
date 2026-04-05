import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import Navbar from '../components/Navbar'
import { Shield, CheckCircle, XCircle, Store } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminDashboard() {
  const [messes, setMesses] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [tab, setTab] = useState('pending')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const messSnap = await getDocs(collection(db, 'messes'))
    setMesses(messSnap.docs.map(d => ({ docId: d.id, ...d.data() })))
    const userSnap = await getDocs(collection(db, 'profiles'))
    setUsers(userSnap.docs.map(d => ({ docId: d.id, ...d.data() })))
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

  const pending = messes.filter(m => !m.is_approved)
  const approved = messes.filter(m => m.is_approved)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-8">
          <Shield className="text-primary" /> Admin Dashboard
        </h1>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-3xl font-bold text-gray-700">{messes.length}</div>
            <div className="text-gray-500">Total Messes</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-3xl font-bold text-green-500">{approved.length}</div>
            <div className="text-gray-500">Approved</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-3xl font-bold text-red-500">{pending.length}</div>
            <div className="text-gray-500">Pending</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-3xl font-bold text-blue-500">{users.length}</div>
            <div className="text-gray-500">Total Users</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          {['pending', 'all', 'users'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition ${tab === t ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-orange-50'}`}>
              {t === 'pending' ? `Pending (${pending.length})` : t === 'all' ? 'All Messes' : 'Users'}
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
                  <p className="text-gray-400 text-sm">{mess.description}</p>
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

        {/* All Messes Tab */}
        {tab === 'all' && (
          <div className="space-y-3">
            {messes.map(mess => (
              <div key={mess.docId} className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold">{mess.name}</h3>
                  <p className="text-gray-500 text-sm">{mess.city} • {mess.cuisine_type}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${mess.is_approved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {mess.is_approved ? 'Approved' : 'Pending'}
                  </span>
                  {mess.is_approved ? (
                    <button onClick={() => rejectMess(mess.docId)} className="text-red-500 text-sm hover:underline">Reject</button>
                  ) : (
                    <button onClick={() => approveMess(mess.docId)} className="text-green-500 text-sm hover:underline">Approve</button>
                  )}
                </div>
              </div>
            ))}
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
      </div>
    </div>
  )
}
