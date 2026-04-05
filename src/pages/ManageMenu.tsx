import { useEffect, useState } from 'react'
import { auth, db } from '../lib/firebase'
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc, query, where } from 'firebase/firestore'
import { uploadImage } from '../lib/imageUpload'
import Navbar from '../components/Navbar'
import { Plus, Trash2, Edit, ChefHat, Upload } from 'lucide-react'
import { toast } from 'sonner'

export default function ManageMenu() {
  const [messId, setMessId] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', description: '', price: '', category: '',
    is_vegetarian: true, is_available: true
  })

  useEffect(() => {
    const fetchMess = async () => {
      if (!auth.currentUser) return
      const snap = await getDocs(query(collection(db, 'messes'), where('owner_id', '==', auth.currentUser.uid)))
      if (!snap.empty) {
        const mid = snap.docs[0].id
        setMessId(mid)
        fetchMenu(mid)
      }
    }
    fetchMess()
  }, [])

  const fetchMenu = async (mid: string) => {
    const snap = await getDocs(query(collection(db, 'menu_items'), where('mess_id', '==', mid)))
    setItems(snap.docs.map(d => ({ docId: d.id, ...d.data() })))
  }

  const handleImageChange = (e: any) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', category: '', is_vegetarian: true, is_available: true })
    setImageFile(null)
    setImagePreview(null)
    setEditItem(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    if (!form.name || !form.price) { toast.error('Name and price required'); return }
    try {
      let image_url = editItem?.image_url || ''
      if (imageFile) {
        toast.info('Uploading image...')
        image_url = await uploadImage(imageFile)
      }
      if (editItem) {
        await updateDoc(doc(db, 'menu_items', editItem.docId), {
          ...form, price: Number(form.price), image_url
        })
        toast.success('Item updated!')
      } else {
        await addDoc(collection(db, 'menu_items'), {
          ...form, price: Number(form.price),
          image_url, mess_id: messId,
          created_at: new Date().toISOString()
        })
        toast.success('Item added!')
      }
      resetForm()
      fetchMenu(messId)
    } catch (e: any) { toast.error(e.message) }
  }

  const deleteItem = async (docId: string) => {
    await deleteDoc(doc(db, 'menu_items', docId))
    toast.success('Item deleted!')
    fetchMenu(messId)
  }

  const startEdit = (item: any) => {
    setEditItem(item)
    setForm({
      name: item.name, description: item.description || '',
      price: item.price, category: item.category || '',
      is_vegetarian: item.is_vegetarian, is_available: item.is_available
    })
    setImagePreview(item.image_url || null)
    setShowForm(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ChefHat className="text-primary" />Manage Menu
          </h1>
          <button onClick={() => { resetForm(); setShowForm(!showForm) }}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center gap-2">
            <Plus className="w-4 h-4" />{showForm ? 'Cancel' : 'Add Item'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="font-bold text-lg mb-4">{editItem ? 'Edit Item' : 'Add New Item'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Food Photo</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-3 text-center cursor-pointer hover:border-primary transition"
                  onClick={() => document.getElementById('menu-image')?.click()}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                  ) : (
                    <div className="py-4">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                      <p className="text-gray-500 text-sm">Click to upload food photo</p>
                    </div>
                  )}
                </div>
                <input id="menu-image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Item Name *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Varan Bhat"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price (₹) *</label>
                  <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                    placeholder="e.g. 80"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Select Category</option>
                    <option>Breakfast</option>
                    <option>Main Course</option>
                    <option>Thali</option>
                    <option>Snacks</option>
                    <option>Drinks</option>
                  </select>
                </div>
                <div className="flex items-center gap-6 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_vegetarian}
                      onChange={e => setForm({ ...form, is_vegetarian: e.target.checked })}
                      className="w-4 h-4 accent-green-500" />
                    <span className="text-sm">Vegetarian</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_available}
                      onChange={e => setForm({ ...form, is_available: e.target.checked })}
                      className="w-4 h-4 accent-primary" />
                    <span className="text-sm">Available</span>
                  </label>
                </div>
              </div>

              <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-orange-600">
                {editItem ? 'Update Item' : 'Add Item'}
              </button>
            </form>
          </div>
        )}

        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center">
              <ChefHat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No menu items yet. Add your first item!</p>
            </div>
          ) : items.map(item => (
            <div key={item.docId} className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
              <div className="flex items-center gap-4">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                ) : (
                  <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center">
                    <ChefHat className="w-8 h-8 text-primary opacity-50" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${item.is_vegetarian ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <h3 className="font-semibold">{item.name}</h3>
                    <span className="text-primary font-bold">₹{item.price}</span>
                    {!item.is_available && <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded">Unavailable</span>}
                  </div>
                  <p className="text-gray-500 text-sm mt-1">{item.description}</p>
                  {item.category && <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded mt-1 inline-block">{item.category}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(item)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                <button onClick={() => deleteItem(item.docId)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}