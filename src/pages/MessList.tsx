import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../lib/firebase'
import { collection, getDocs } from 'firebase/firestore'
import Navbar from '../components/Navbar'
import { MapPin, Star, Search, Utensils } from 'lucide-react'

export default function MessList() {
  const navigate = useNavigate()
  const [messes, setMesses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchMesses = async () => {
      try {
        const snap = await getDocs(collection(db, 'messes'))
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        const approved = all.filter((m: any) => m.is_approved === true)
        setMesses(approved)
      } catch (e) {
        console.error(e)
      }
      setLoading(false)
    }
    fetchMesses()
  }, [])

  const filtered = messes.filter((m: any) =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.city?.toLowerCase().includes(search.toLowerCase()) ||
    m.cuisine_type?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-4 transition"><span>←</span> Back</button>
        <h1 className="text-3xl font-bold mb-2">Discover Local Messes</h1>
        <p className="text-gray-500 mb-6">Find the best homemade food near you</p>

        <div className="relative max-w-lg mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            placeholder="Search by name, city, or cuisine..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-xl shadow animate-pulse h-64"></div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Utensils className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-500">No messes found</h3>
            <p className="text-gray-400 mt-2">Check back soon for new listings</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {filtered.map((mess: any) => (
              <div key={mess.id} className="bg-white rounded-xl shadow hover:shadow-lg transition cursor-pointer" onClick={() => navigate(`/mess/${mess.id}`)}>
                <div className="h-48 bg-gradient-to-br from-orange-200 to-amber-200 rounded-t-xl flex items-center justify-center">
                  {mess.image_url ? (
                    <img src={mess.image_url} alt={mess.name} className="w-full h-full object-cover rounded-t-xl" />
                  ) : (
                    <Utensils className="w-16 h-16 text-primary opacity-50" />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{mess.name}</h3>
                    <span className="bg-green-100 text-green-700 text-sm px-2 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-green-500" />
                      {mess.average_rating || '4.5'}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mb-3 line-clamp-2">{mess.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{mess.city}</span>
                    {mess.cuisine_type && <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded">{mess.cuisine_type}</span>}
                  </div>
                  <button className="w-full mt-4 bg-primary text-white py-2 rounded-lg hover:bg-orange-600 transition">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
