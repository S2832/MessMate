import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { auth, db } from '../lib/firebase'
import { collection, addDoc } from 'firebase/firestore'
import Navbar from '../components/Navbar'
import { ShoppingBag, CheckCircle, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

export default function Checkout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { cart, mess, total } = location.state || {}
  const [loading, setLoading] = useState(false)
  const [paid, setPaid] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('')

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) { resolve(true); return }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handleRazorpay = async () => {
    const loaded = await loadRazorpay()
    if (!loaded) { toast.error('Razorpay failed to load'); return }

    const options = {
      
    key: 'rzp_test_SZfqQiZ6O2wpnn', // Demo key
      amount: total * 100, // in paise
      currency: 'INR',
      name: 'MessMate',
      description: `Order from ${mess?.name}`,
      image: 'https://via.placeholder.com/150?text=MM',
      handler: async function(response: any) {
        // Payment successful
        await saveOrder('Razorpay', response.razorpay_payment_id)
        setPaid(true)
        toast.success('Payment Successful! 🎉')
      },
      prefill: {
        name: auth.currentUser?.displayName || '',
        email: auth.currentUser?.email || '',
      },
      theme: { color: '#e85d04' },
      modal: {
        ondismiss: () => toast.info('Payment cancelled')
      }
    }

    const rzp = new (window as any).Razorpay(options)
    rzp.open()
  }

  const saveOrder = async (method: string, transactionId?: string) => {
    if (!auth.currentUser) return
    await addDoc(collection(db, 'orders'), {
      user_id: auth.currentUser.uid,
      mess_id: mess?.id,
      mess_name: mess?.name,
      items: cart,
      total,
      payment_method: method,
      transaction_id: transactionId || 'DEMO-' + Date.now(),
        order_id: await (async () => { const { getDocs, collection } = await import('firebase/firestore'); const snap = await getDocs(collection(db, 'orders')); const count = snap.size + 1; return 'MM-' + new Date().getFullYear() + '-' + String(count).padStart(3, '0'); })(),
      status: 'pending',
      created_at: new Date().toISOString()
    })
  }

  const handleDemoPayment = async (method: string) => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 2000))
    try {
      await saveOrder(method)
      setPaid(true)
      toast.success('Payment Successful! 🎉')
    } catch (e: any) {
      toast.error(e.message)
    }
    setLoading(false)
  }

  if (paid) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-3">Order Placed! 🎉</h1>
        <p className="text-gray-500 mb-6">Your order has been placed. The mess owner will confirm it soon.</p>
        <button onClick={() => navigate('/dashboard')} className="bg-primary text-white px-8 py-3 rounded-xl hover:bg-orange-600">
          Go to Dashboard
        </button>
      </div>
    </div>
  )

  if (!cart || !mess) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-4">No order data found</p>
        <button onClick={() => navigate('/messes')} className="bg-primary text-white px-4 py-2 rounded-lg">Browse Messes</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">

        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-4 transition">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <ShoppingBag className="text-primary" />Checkout
        </h1>

        {/* Order Summary */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="font-bold text-lg mb-4">Order Summary - {mess.name}</h2>
          {cart.map((item: any, i: number) => (
            <div key={i} className="flex justify-between py-2 border-b last:border-0">
              <span>{item.name} x{item.quantity}</span>
              <span>₹{item.price * item.quantity}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-lg mt-3 pt-3 border-t">
            <span>Total Amount</span>
            <span className="text-primary">₹{total}</span>
          </div>
        </div>

        {/* Payment Options */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="font-bold text-lg mb-4">💳 Choose Payment Method</h2>
          
          {/* Razorpay */}
          <div className="border-2 border-blue-200 rounded-xl p-4 mb-4 bg-blue-50">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-blue-700">🔵 Razorpay</h3>
                <p className="text-blue-600 text-sm">UPI, Cards, Net Banking (Demo Mode)</p>
              </div>
              <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">Recommended</span>
            </div>
            <button onClick={handleRazorpay} disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50">
              Pay ₹{total} with Razorpay
            </button>
          </div>

          
{/* Cash on Delivery Only */}
          <p className="text-gray-500 text-sm text-center mb-3">— or pay at delivery —</p>
          <button onClick={() => handleDemoPayment('Cash on Delivery')} disabled={loading}
            className="w-full p-4 border-2 border-gray-200 rounded-xl font-medium hover:shadow-md hover:border-primary transition disabled:opacity-50">
            <div className="text-2xl mb-1">💵</div>
            <div>Cash on Delivery</div>
          </button>
        </div>

        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-gray-500">Processing payment...</p>
          </div>
        )}
      </div>
    </div>
  )
}