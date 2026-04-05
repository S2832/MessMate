import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../lib/firebase'
import { collection, addDoc } from 'firebase/firestore'
import { uploadImage } from '../lib/imageUpload'
import Navbar from '../components/Navbar'
import { Store, Upload } from 'lucide-react'
import { toast } from 'sonner'

export default function RegisterMess() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', description: '', cuisine_type: '',
    address: '', city: '', phone: ''
  })

  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleImageChange = (e: any) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    if (!auth.currentUser) { toast.error('Please login first'); return }
    if (!form.name || !form.city || !form.phone) { toast.error('Please fill all required fields'); return }
    setLoading(true)
    try {
      let image_url = ''
      if (imageFile) {
        toast.info('Uploading image...')
        image_url = await uploadImage(imageFile)
      }
      await addDoc(collection(db, 'messes'), {
        ...form,
        image_url,
        owner_id: auth.currentUser.uid,
        is_approved: false,
        average_rating: 0,
        total_reviews: 0,
        created_at: new Date().toISOString()
      })
      toast.success('Mess registered! Waiting for admin approval.')
      navigate('/mess-owner')
    } catch (e: any) {
      toast.error(e.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow p-8">
          <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Store className="text-primary" />Register Your Mess</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mess Photo</label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-primary transition cursor-pointer" onClick={() => document.getElementById('mess-image')?.click()}>
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                ) : (
                  <div className="py-8">
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Click to upload mess photo</p>
                    <p className="text-gray-400 text-sm">JPG, PNG (max 5MB)</p>
                  </div>
                )}
              </div>
              <input id="mess-image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mess Name *</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Aai's Kitchen" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} placeholder="Describe your mess..." rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine Type</label>
                <select name="cuisine_type" value={form.cuisine_type} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Select Cuisine</option>
                  <option>Maharashtrian</option>
                  <option>North Indian</option>
                  <option>South Indian</option>
                  <option>Gujarati</option>
                  <option>Mixed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input name="city" value={form.city} onChange={handleChange} placeholder="e.g. Pune" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input name="address" value={form.address} onChange={handleChange} placeholder="Full address" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="10 digit phone number" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50">
              {loading ? 'Registering...' : 'Register Mess'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}