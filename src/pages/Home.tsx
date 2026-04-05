import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { Search, Utensils, Star, Clock, Shield } from 'lucide-react'

const FOOD_PHOTOS = [
  'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80',
  'https://images.unsplash.com/photo-1631515242808-497c3fbd3972?w=400&q=80',
  'https://images.unsplash.com/photo-1567337710282-00832b415979?w=400&q=80',
  'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&q=80',
  'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80',
  'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&q=80',
]

const FOOD_NAMES = [
  'Dal Chawal', 'Biryani', 'Thali', 'Pav Bhaji', 'Idli Sambar', 'Varan Bhat'
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-50 to-amber-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block bg-orange-100 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
                🍽️ Your Local Mess Finder
              </div>
              <h1 className="text-5xl font-bold text-gray-800 mb-6 leading-tight">
                Delicious <span className="text-primary">Home-Cooked Meals</span> Delivered to You
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Discover authentic local mess and tiffin services near you. Fresh, affordable, and tasty meals every day.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => navigate('/messes')} className="bg-primary text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-orange-600 transition shadow-lg">
                  🍽️ Browse Messes
                </button>
                <button onClick={() => navigate('/auth')} className="border-2 border-primary text-primary px-8 py-4 rounded-xl text-lg font-semibold hover:bg-orange-50 transition">
                  Sign Up Free
                </button>
              </div>
              <div className="flex gap-8 mt-10">
                <div><div className="text-3xl font-bold text-primary">500+</div><div className="text-gray-500">Messes</div></div>
                <div><div className="text-3xl font-bold text-secondary">50K+</div><div className="text-gray-500">Customers</div></div>
                <div><div className="text-3xl font-bold text-orange-400">4.8★</div><div className="text-gray-500">Rating</div></div>
              </div>
            </div>
            {/* Food Photos Grid */}
            <div className="hidden lg:grid grid-cols-3 gap-3">
              {FOOD_PHOTOS.map((photo, i) => (
                <div key={i} className={`rounded-2xl overflow-hidden shadow-lg ${i === 0 ? 'col-span-2 row-span-2' : ''}`}>
                  <img src={photo} alt={FOOD_NAMES[i]} className="w-full h-full object-cover hover:scale-105 transition duration-300" style={{ height: i === 0 ? '260px' : '120px' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Popular Food Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">Popular Food Categories</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {[
              { name: 'Maharashtrian', img: 'https://images.unsplash.com/photo-1631515242808-497c3fbd3972?w=200&q=80', emoji: '🍛' },
              { name: 'North Indian', img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&q=80', emoji: '🫓' },
              { name: 'South Indian', img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=200&q=80', emoji: '🥞' },
              { name: 'Gujarati', img: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=200&q=80', emoji: '🍱' },
              { name: 'Thali', img: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=200&q=80', emoji: '🍽️' },
              { name: 'Biryani', img: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=200&q=80', emoji: '🍚' },
            ].map((cat, i) => (
              <div key={i} onClick={() => navigate('/messes')} className="cursor-pointer text-center group">
                <div className="rounded-2xl overflow-hidden mb-2 shadow hover:shadow-lg transition">
                  <img src={cat.img} alt={cat.name} className="w-full h-20 object-cover group-hover:scale-105 transition duration-300" />
                </div>
                <p className="text-sm font-medium text-gray-700">{cat.emoji} {cat.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose MessMate?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Search, title: 'Easy Discovery', desc: 'Find the best local messes with smart filters', color: 'text-primary', bg: 'bg-orange-100' },
              { icon: Utensils, title: 'Variety of Cuisines', desc: 'From Maharashtrian to South Indian food', color: 'text-secondary', bg: 'bg-amber-100' },
              { icon: Star, title: 'Verified Reviews', desc: 'Real ratings from verified customers', color: 'text-yellow-500', bg: 'bg-yellow-100' },
              { icon: Clock, title: 'Subscribe & Save', desc: 'Daily, weekly or monthly meal plans', color: 'text-blue-500', bg: 'bg-blue-100' },
              { icon: Shield, title: 'Secure Payments', desc: 'Razorpay secure payment gateway', color: 'text-green-500', bg: 'bg-green-100' },
              { icon: Utensils, title: 'Support Local', desc: 'Help local mess owners grow', color: 'text-red-500', bg: 'bg-red-100' },
            ].map((f, i) => (
              <div key={i} className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition">
                <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <f.icon className={`h-6 w-6 ${f.color}`} />
                </div>
                <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-12">How It Works?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Browse & Select', desc: 'Search for messes near you', icon: '🔍' },
              { step: '2', title: 'Order & Pay', desc: 'Place order and pay securely', icon: '🛒' },
              { step: '3', title: 'Enjoy Your Meal', desc: 'Fresh food delivered to you', icon: '😋' },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-orange-400 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4 shadow-lg">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/messes')} className="mt-10 bg-primary text-white px-10 py-4 rounded-xl text-lg font-semibold hover:bg-orange-600 shadow-lg transition">
            Get Started Now 🚀
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 text-center">
        <p className="text-lg font-semibold mb-2">🍽️ MessMate</p>
        <p className="text-gray-400">© 2025 MessMate. Made with ❤️ for food lovers.</p>
      </footer>
    </div>
  )
}