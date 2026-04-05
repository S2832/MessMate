import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../lib/firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { toast } from 'sonner'
import { Utensils, User, Store } from 'lucide-react'

export default function Auth() {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    email: '', password: '', name: '', role: 'customer', city: '', phone: ''
  })

  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleLogin = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { user } = await signInWithEmailAndPassword(auth, form.email, form.password)
      const roleDoc = await getDoc(doc(db, 'user_roles', user.uid))
      const role = roleDoc.exists() ? roleDoc.data().role : 'customer'
      toast.success('Welcome back!')
      if (role === 'admin') navigate('/admin')
      else if (role === 'mess_owner') navigate('/mess-owner')
      else navigate('/dashboard')
    } catch (e: any) {
      toast.error(e.message)
    }
    setLoading(false)
  }

  const handleSignup = async (e: any) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) {
      toast.error('Please fill all fields')
      return
    }
    if (form.phone && !/^[6-9][0-9]{9}$/.test(form.phone)) {
      toast.error('Please enter valid Indian mobile number (starts with 6-9)')
      return
    }
    setLoading(true)
    try {
      const { user } = await createUserWithEmailAndPassword(auth, form.email, form.password)
      await updateProfile(user, { displayName: form.name })
      await setDoc(doc(db, 'profiles', user.uid), {
        uid: user.uid, name: form.name, email: form.email,
        role: form.role, city: form.city, phone: form.phone,
        created_at: new Date().toISOString()
      })
      await setDoc(doc(db, 'user_roles', user.uid), {
        user_id: user.uid, role: form.role,
        created_at: new Date().toISOString()
      })
      await import('firebase/auth').then(({ sendEmailVerification }) => sendEmailVerification(user));
toast.success('Account created! Please verify your email.')
      setIsLogin(true)
setForm({...form, password: ''})
return
    } catch (e: any) {
      toast.error(e.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="bg-primary rounded-xl w-12 h-12 flex items-center justify-center mx-auto mb-3">
            <Utensils className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">MessMate</h1>
          <p className="text-gray-500 mt-1">{isLogin ? 'Welcome back!' : 'Create your account'}</p>
        </div>

        {/* Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 rounded-md text-sm font-medium transition ${isLogin ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>Login</button>
          <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 rounded-md text-sm font-medium transition ${!isLogin ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>Sign Up</button>
        </div>

        <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
          {!isLogin && (
            <>
              <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required />
              
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setForm({ ...form, role: 'customer' })}
                    className={`p-3 border-2 rounded-lg flex flex-col items-center gap-1 transition ${form.role === 'customer' ? 'border-primary bg-orange-50' : 'border-gray-200'}`}>
                    <User className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">Customer</span>
                  </button>
                  <button type="button" onClick={() => setForm({ ...form, role: 'mess_owner' })}
                    className={`p-3 border-2 rounded-lg flex flex-col items-center gap-1 transition ${form.role === 'mess_owner' ? 'border-primary bg-orange-50' : 'border-gray-200'}`}>
                    <Store className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">Mess Owner</span>
                  </button>
                </div>
              </div>

              <input name="city" placeholder="City" value={form.city} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
              <input name="phone" placeholder="Phone Number" maxLength={10} pattern="[0-9]{10}" value={form.phone} onChange={e => { if(e.target.value.length <= 10 && /^[0-9]*$/.test(e.target.value)) setForm({...form, phone: e.target.value}) }} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
            </>
          )}

          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required />
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required />

          <button type="submit" disabled={loading} className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50">
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
          </button>
          {isLogin && (
            <button type="button" onClick={async () => {
              if (!form.email) { toast.error('Please enter your email first'); return; }
              const { sendPasswordResetEmail } = await import('firebase/auth');
              await sendPasswordResetEmail(auth, form.email);
              toast.success('Password reset email sent! Check your inbox 📧');
            }} className="w-full text-primary text-sm hover:underline mt-2">
              Forgot Password?
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
