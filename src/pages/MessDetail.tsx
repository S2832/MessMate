import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db, auth } from '../lib/firebase'
import { doc, getDoc, collection, getDocs, query, where, addDoc } from 'firebase/firestore'
import Navbar from '../components/Navbar'
import { MapPin, Phone, Star, Plus, Minus, ShoppingCart, Utensils, ArrowLeft, Send } from 'lucide-react'
import { toast } from 'sonner'

export default function MessDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [mess, setMess] = useState<any>(null)
  const [menu, setMenu] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [cart, setCart] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [hasOrdered, setHasOrdered] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return
      const messDoc = await getDoc(doc(db, 'messes', id))
      if (messDoc.exists()) setMess({ id: messDoc.id, ...messDoc.data() })
      const menuSnap = await getDocs(query(collection(db, 'menu_items'), where('mess_id', '==', id)))
      setMenu(menuSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      const reviewSnap = await getDocs(query(collection(db, 'reviews'), where('mess_id', '==', id)))
      setReviews(reviewSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      if (auth.currentUser) {
        const orderSnap = await getDocs(query(collection(db, 'orders'), where('user_id', '==', auth.currentUser.uid), where('mess_id', '==', id)))
        setHasOrdered(!orderSnap.empty)
      }
      setLoading(false)
    }
    fetchData()
  }, [id])

  const addToCart = (itemId: string) => {
    if (!auth.currentUser) { toast.error('Please login first'); navigate('/auth'); return }
    setCart(c => ({ ...c, [itemId]: (c[itemId] || 0) + 1 }))
  }
  const removeFromCart = (itemId: string) => setCart(c => {
    const newCart = { ...c }
    if (newCart[itemId] > 1) newCart[itemId]--
    else delete newCart[itemId]
    return newCart
  })

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0)
  const totalPrice = Object.entries(cart).reduce((total, [itemId, qty]) => {
    const item = menu.find(m => m.id === itemId)
    return total + (item?.price || 0) * qty
  }, 0)

  const handleCheckout = () => {
    if (!auth.currentUser) { toast.error('Please login first'); navigate('/auth'); return }
    if (totalItems === 0) { toast.error('Add items to cart first'); return }
    const cartItems = Object.entries(cart).map(([itemId, qty]) => {
      const item = menu.find(m => m.id === itemId)
      return { ...item, quantity: qty }
    })
    navigate('/checkout', { state: { cart: cartItems, mess, total: totalPrice } })
  }

  const submitReview = async () => {
    if (!auth.currentUser) { toast.error('Please login to submit review'); navigate('/auth'); return }
    if (!hasOrdered) { toast.error('Place an order first to write a review!'); return }
    if (!reviewComment.trim()) { toast.error('Please write a comment'); return }
    setSubmittingReview(true)
    try {
      await addDoc(collection(db, 'reviews'), {
        mess_id: id,
        user_id: auth.currentUser.uid,
        user_name: auth.currentUser.displayName || 'Anonymous',
        rating: reviewRating,
        comment: reviewComment,
        created_at: new Date().toISOString()
      })
      toast.success('Review submitted! Thank you 😊')
      setReviewComment('')
      setReviewRating(5)
      const reviewSnap = await getDocs(query(collection(db, 'reviews'), where('mess_id', '==', id)))
      setReviews(reviewSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e: any) { toast.error(e.message) }
    setSubmittingReview(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>
  if (!mess) return <div className="min-h-screen flex items-center justify-center"><p>Mess not found</p></div>

  const availableMenu = menu.filter(m => m.is_available)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-4 transition">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          {mess.image_url && <img src={mess.image_url} alt={mess.name} className="w-full h-48 object-cover rounded-xl mb-4" />}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{mess.name}</h1>
              <p className="text-gray-500 mb-4">{mess.description}</p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{mess.address}, {mess.city}</span>
                <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{mess.phone}</span>
                <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />{reviews.length > 0 ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : '0'} ({reviews.length} reviews)</span>
              </div>
            </div>
            {mess.cuisine_type && <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full">{mess.cuisine_type}</span>}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Menu</h2>
              {availableMenu.length === 0 ? (
                <div className="bg-white rounded-xl shadow p-8 text-center">
                  <Utensils className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No menu items yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableMenu.map(item => (
                    <div key={item.id} className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                        ) : (
                          <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Utensils className="w-6 h-6 text-primary opacity-50" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full border-2 ${item.is_vegetarian ? 'border-green-500 bg-green-500' : 'border-red-500 bg-red-500'}`}></span>
                            <h4 className="font-semibold">{item.name}</h4>
                          </div>
                          <p className="text-gray-500 text-sm">{item.description}</p>
                          <p className="text-primary font-bold">₹{item.price}</p>
                          {item.category && <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded">{item.category}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {cart[item.id] ? (
                          <>
                            <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 bg-orange-100 text-primary rounded-full flex items-center justify-center hover:bg-orange-200"><Minus className="w-4 h-4" /></button>
                            <span className="font-bold w-6 text-center">{cart[item.id]}</span>
                            <button onClick={() => addToCart(item.id)} className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center hover:bg-orange-600"><Plus className="w-4 h-4" /></button>
                          </>
                        ) : (
                          <button onClick={() => addToCart(item.id)} className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600">Add</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Reviews</h2>
              {hasOrdered ? (
                <div className="bg-white rounded-xl shadow p-6 mb-4">
                  <h3 className="font-semibold mb-3">Write a Review</h3>
                  <div className="flex gap-2 mb-3">
                    {[1,2,3,4,5].map(star => (
                      <button key={star} onClick={() => setReviewRating(star)}>
                        <Star className={`w-8 h-8 ${star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                      </button>
                    ))}
                    <span className="text-gray-500 self-center ml-2">{reviewRating}/5</span>
                  </div>
                  <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)}
                    placeholder="Share your experience..." rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary mb-3" />
                  <button onClick={submitReview} disabled={submittingReview}
                    className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-orange-600 flex items-center gap-2 disabled:opacity-50">
                    <Send className="w-4 h-4" />{submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              ) : (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4 text-center">
                  <p className="text-orange-600">⚠️ Place an order first to write a review!</p>
                </div>
              )}

              {reviews.length === 0 ? (
                <div className="bg-white rounded-xl shadow p-6 text-center">
                  <p className="text-gray-500">No reviews yet. Be the first!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map(review => (
                    <div key={review.id} className="bg-white rounded-xl shadow p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{review.user_name}</p>
                          <div className="flex gap-1">
                            {[1,2,3,4,5].map(star => (
                              <Star key={star} className={`w-4 h-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                            ))}
                          </div>
                        </div>
                        <span className="text-gray-400 text-sm">{new Date(review.created_at).toLocaleDateString('en-IN')}</span>
                      </div>
                      <p className="text-gray-600">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow p-6 sticky top-24">
              <h3 className="font-bold text-xl mb-4 flex items-center gap-2"><ShoppingCart className="w-5 h-5" />Your Cart</h3>
              {totalItems === 0 ? (
                <p className="text-gray-400 text-center py-4">Your cart is empty</p>
              ) : (
                <>
                  {Object.entries(cart).map(([itemId, qty]) => {
                    const item = menu.find(m => m.id === itemId)
                    if (!item) return null
                    return (
                      <div key={itemId} className="flex justify-between mb-2 text-sm">
                        <span>{item.name} x{qty}</span>
                        <span>₹{item.price * qty}</span>
                      </div>
                    )
                  })}
                  <div className="border-t mt-3 pt-3 flex justify-between font-bold">
                    <span>Total</span>
                    <span>₹{totalPrice}</span>
                  </div>
                  <button onClick={handleCheckout} className="w-full bg-primary text-white py-3 rounded-lg mt-4 hover:bg-orange-600 font-semibold">
                    Proceed to Checkout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}