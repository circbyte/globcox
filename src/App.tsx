/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, orderBy, limit, serverTimestamp, addDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, OperationType, handleFirestoreError } from './firebase';
import { UserProfile, Product, CATEGORIES, Message, Chat } from './types';
import { 
  Home as HomeIcon, 
  PlusCircle, 
  MessageSquare, 
  User as UserIcon, 
  Search, 
  Zap, 
  ShieldCheck, 
  Phone, 
  MapPin, 
  ArrowLeft,
  WifiOff,
  Star,
  CheckCircle2,
  TrendingUp,
  Menu,
  X,
  LogOut,
  Mail,
  Lock,
  Key
} from 'lucide-react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendSignInLinkToEmail, 
  isSignInWithEmailLink, 
  signInWithEmailLink 
} from 'firebase/auth';
import { actionCodeSettings } from './firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Contexts ---
const AuthContext = createContext<{
  user: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}>({ user: null, loading: true, login: async () => {}, logout: async () => {} });

const LowDataContext = createContext<{
  lowData: boolean;
  setLowData: (v: boolean) => void;
}>({ lowData: false, setLowData: () => {} });

// --- Components ---

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            setUser(userDoc.data() as UserProfile);
          } else {
            const newUser: UserProfile = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || undefined,
              phoneNumber: firebaseUser.phoneNumber || '',
              isVerified: false,
              interests: [],
              earnings: 0,
              savings: 0,
              streak: 1,
              lastActive: serverTimestamp(),
            };
            await setDoc(userRef, newUser);
            setUser(newUser);
          }
        } catch (error) {
          console.error("Error fetching user profile", error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const LowDataProvider = ({ children }: { children: React.ReactNode }) => {
  const [lowData, setLowData] = useState(() => {
    const saved = localStorage.getItem('lowData');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('lowData', String(lowData));
  }, [lowData]);

  return (
    <LowDataContext.Provider value={{ lowData, setLowData }}>
      {children}
    </LowDataContext.Provider>
  );
};

// --- Layout ---

const Navbar = () => {
  const { user, login, logout } = useContext(AuthContext);
  const { lowData, setLowData } = useContext(LowDataContext);
  const location = useLocation();

  const navItems = [
    { path: '/', icon: HomeIcon, label: 'Feed' },
    { path: '/post', icon: PlusCircle, label: 'Sell' },
    { path: '/chats', icon: MessageSquare, label: 'Chats' },
    { path: '/profile', icon: UserIcon, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:top-0 md:bottom-auto md:border-t-0 md:border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="hidden md:flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-indigo-900">globcox</span>
          </Link>

          {/* Mobile Nav */}
          <div className="flex md:hidden justify-around w-full">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center w-full py-1 transition-colors",
                  location.pathname === item.path ? "text-indigo-600" : "text-gray-500"
                )}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-[10px] mt-1">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center space-x-2 font-medium transition-colors",
                  location.pathname === item.path ? "text-indigo-600" : "text-gray-600 hover:text-indigo-500"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            ))}
            
            <button
              onClick={() => setLowData(!lowData)}
              className={cn(
                "flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium border transition-all",
                lowData ? "bg-indigo-100 border-indigo-200 text-indigo-700" : "bg-gray-100 border-gray-200 text-gray-600"
              )}
            >
              <WifiOff className="w-3 h-3" />
              <span>{lowData ? 'Data Saver ON' : 'Data Saver'}</span>
            </button>

            {user ? (
              <button onClick={logout} className="text-gray-600 hover:text-red-500">
                <LogOut className="w-5 h-5" />
              </button>
            ) : (
              <Link to="/login" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

// --- Pages ---

const Home = () => {
  const { lowData } = useContext(LowDataContext);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [distance, setDistance] = useState('All');

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(50));
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(items);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesCategory = filter === 'All' || p.category === filter;
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.location.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="pb-20 md:pt-20">
      {/* Search & Filters */}
      <div className="sticky top-0 md:top-16 bg-white/80 backdrop-blur-md border-b border-gray-100 z-40 px-4 py-3">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search maize, goats..."
                className="w-full bg-gray-100 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select 
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className="bg-gray-100 border-none rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Distances</option>
              <option value="5km">5km</option>
              <option value="20km">20km</option>
              <option value="District">District</option>
            </select>
          </div>
          <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar">
            {['All', ...CATEGORIES].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                  filter === cat ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-4">
        {/* Hot Right Now */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="text-orange-500 w-5 h-5" />
              <h2 className="font-bold text-gray-900">Hot Right Now</h2>
            </div>
            <span className="text-xs text-indigo-600 font-medium">Peak Hours</span>
          </div>
          <div className="flex space-x-4 overflow-x-auto pb-4 no-scrollbar">
            {products.slice(0, 5).map((p) => (
              <Link key={p.id} to={`/product/${p.id}`} className="flex-shrink-0 w-64 bg-white border border-gray-100 rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow">
                {!lowData && p.photoURL && (
                  <img src={p.photoURL} alt={p.title} className="w-full h-32 object-cover rounded-xl mb-3" referrerPolicy="no-referrer" />
                )}
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{p.title}</h3>
                  <span className="text-indigo-600 font-bold">MK {p.price.toLocaleString()}</span>
                </div>
                <div className="flex items-center text-xs text-gray-500 mt-2">
                  <MapPin className="w-3 h-3 mr-1" />
                  {p.location}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Main Feed */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((p) => (
            <Link key={p.id} to={`/product/${p.id}`} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
              {!lowData && p.photoURL ? (
                <div className="aspect-video overflow-hidden">
                  <img src={p.photoURL} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                </div>
              ) : (
                <div className="aspect-video bg-emerald-50 flex items-center justify-center">
                  <Zap className="text-emerald-200 w-12 h-12" />
                </div>
              )}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{p.title}</h3>
                    <p className="text-xs text-gray-500">{p.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-600 font-bold text-lg">MK {p.price.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400">Negotiable</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold">
                      {p.sellerName[0]}
                    </div>
                    <span className="text-xs text-gray-600">{p.sellerName}</span>
                    <ShieldCheck className="w-3 h-3 text-blue-500" />
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <MapPin className="w-3 h-3 mr-1" />
                    {p.location}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

const PostProduct = () => {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    category: CATEGORIES[0],
    isDigital: false,
    photoURL: ''
  });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <ShieldCheck className="w-16 h-16 text-emerald-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Login to Sell</h2>
        <p className="text-gray-600 mb-6">Join thousands of Malawians trading safely every day.</p>
        <button onClick={login} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-200">
          Login with Google
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const productData = {
        ...form,
        price: Number(form.price),
        sellerId: user.uid,
        sellerName: user.displayName,
        createdAt: serverTimestamp(),
        isSold: false,
      };
      await addDoc(collection(db, 'products'), productData);
      navigate('/');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24 md:pt-24">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Post an Item</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">What are you selling?</label>
            <input
              required
              type="text"
              placeholder="e.g. 50kg Maize, Boer Goat"
              className="w-full border-gray-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (MK)</label>
              <input
                required
                type="number"
                placeholder="Amount"
                className="w-full border-gray-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                className="w-full border-gray-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location (Village/Trading Centre)</label>
            <input
              required
              type="text"
              placeholder="e.g. Mitundu, Lilongwe"
              className="w-full border-gray-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={4}
              placeholder="Tell buyers more about your product..."
              className="w-full border-gray-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo URL (Optional)</label>
            <input
              type="url"
              placeholder="https://..."
              className="w-full border-gray-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
              value={form.photoURL}
              onChange={(e) => setForm({ ...form, photoURL: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isDigital"
              className="rounded text-indigo-600 focus:ring-indigo-500"
              checked={form.isDigital}
              onChange={(e) => {
                if (e.target.checked && !user.isVerified) {
                  alert("Only verified sellers can post digital products. Please verify your identity in profile.");
                  return;
                }
                setForm({ ...form, isDigital: e.target.checked });
              }}
            />
            <label htmlFor="isDigital" className="text-sm text-gray-700">This is a digital product (eBook, etc.)</label>
          </div>
        </div>

        <button
          disabled={loading}
          type="submit"
          className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-indigo-100 disabled:opacity-50"
        >
          {loading ? 'Posting...' : 'Post Listing'}
        </button>
      </form>
    </div>
  );
};

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, login } = useContext(AuthContext);
  const { lowData } = useContext(LowDataContext);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    const docRef = doc(db, 'products', id);
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        setProduct({ id: doc.id, ...doc.data() } as Product);
      }
      setLoading(false);
    });
  }, [id]);

  const handleConnect = async () => {
    if (!user) return login();
    if (!product) return;
    
    // Create or find chat
    const chatId = [user.uid, product.sellerId].sort().join('_');
    const chatRef = doc(db, 'chats', chatId);
    const chatDoc = await getDoc(chatRef);
    
    if (!chatDoc.exists()) {
      await setDoc(chatRef, {
        participants: [user.uid, product.sellerId],
        lastMessage: `Interested in ${product.title}`,
        updatedAt: serverTimestamp(),
        productId: product.id
      });
    }
    navigate(`/chat/${chatId}`);
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!product) return <div className="p-8 text-center">Product not found</div>;

  return (
    <div className="pb-24 md:pt-24">
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          <button onClick={() => navigate(-1)} className="absolute top-4 left-4 z-10 bg-white/80 p-2 rounded-full shadow-md">
            <ArrowLeft className="w-5 h-5" />
          </button>
          {!lowData && product.photoURL ? (
            <img src={product.photoURL} alt={product.title} className="w-full aspect-video object-cover md:rounded-2xl" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full aspect-video bg-indigo-50 flex items-center justify-center md:rounded-2xl">
              <Zap className="text-indigo-200 w-24 h-24" />
            </div>
          )}
        </div>

        <div className="px-4 py-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{product.title}</h1>
              <div className="flex items-center text-gray-500 mt-1">
                <MapPin className="w-4 h-4 mr-1" />
                {product.location}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-indigo-600">MK {product.price.toLocaleString()}</div>
              <span className="text-xs text-gray-400">Fixed Price</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <h2 className="font-semibold text-gray-900 mb-2">Description</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{product.description || 'No description provided.'}</p>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-700">
                {product.sellerName[0]}
              </div>
              <div>
                <div className="flex items-center space-x-1">
                  <span className="font-bold text-gray-900">{product.sellerName}</span>
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 mr-1" />
                  4.8 (12 deals)
                </div>
              </div>
            </div>
            <button className="text-indigo-600 text-sm font-bold">View Profile</button>
          </div>

          <div className="fixed bottom-20 left-0 right-0 px-4 md:relative md:bottom-0 md:px-0 flex space-x-3">
            <button
              onClick={handleConnect}
              className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg shadow-indigo-100"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Chat Now</span>
            </button>
            <a
              href="tel:+265000000000"
              className="w-16 bg-white border border-indigo-600 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm"
            >
              <Phone className="w-6 h-6" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatRoom = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [showRating, setShowRating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, 'chats', id, 'messages'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
    });
  }, [id]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user || !id) return;
    
    const msgData = {
      chatId: id,
      senderId: user.uid,
      text: text.trim(),
      createdAt: serverTimestamp()
    };
    
    setText('');
    await addDoc(collection(db, 'chats', id, 'messages'), msgData);
    await updateDoc(doc(db, 'chats', id), {
      lastMessage: text.trim(),
      updatedAt: serverTimestamp()
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:pt-16">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></button>
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-700">S</div>
          <span className="font-bold">Seller Name</span>
        </div>
        <button 
          onClick={() => setShowRating(true)}
          className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full font-bold border border-indigo-100"
        >
          Deal Closed?
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.senderId === user?.uid ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[80%] px-4 py-2 rounded-2xl text-sm",
              m.senderId === user?.uid ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white text-gray-800 rounded-tl-none shadow-sm"
            )}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-100 flex space-x-2">
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="bg-indigo-600 text-white p-2 rounded-xl">
          <Zap className="w-5 h-5 fill-white" />
        </button>
      </form>

      <AnimatePresence>
        {showRating && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm text-center"
            >
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-indigo-600 fill-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Rate your deal</h3>
              <p className="text-sm text-gray-500 mb-6">How was your experience with this seller?</p>
              
              <div className="flex justify-center space-x-2 mb-8">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} className="text-gray-300 hover:text-yellow-400 transition-colors">
                    <Star className="w-8 h-8" />
                  </button>
                ))}
              </div>

              <div className="flex space-x-3">
                <button onClick={() => setShowRating(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold">Cancel</button>
                <button onClick={() => setShowRating(false)} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">Submit</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Login = () => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup' | 'passwordless'>('login');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
        navigate('/');
      } else if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/');
      } else {
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        window.localStorage.setItem('emailForSignIn', email);
        setMessage('Check your email for the sign-in link!');
      }
    } catch (error: any) {
      setMessage(error.message);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap className="text-white w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome to globcox</h2>
          <p className="text-gray-500">Malawi's premier marketplace</p>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-gray-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {mode !== 'passwordless' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border-gray-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          )}

          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-100">
            {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Magic Link'}
          </button>
        </form>

        <div className="mt-6 space-y-3">
          <button onClick={login} className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold flex items-center justify-center space-x-2">
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" />
            <span>Continue with Google</span>
          </button>

          <div className="flex justify-center space-x-4 text-sm">
            <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-indigo-600 font-medium">
              {mode === 'login' ? 'Need an account?' : 'Already have an account?'}
            </button>
            <button onClick={() => setMode('passwordless')} className="text-gray-500">
              Passwordless Sign-in
            </button>
          </div>
        </div>

        {message && <p className="mt-4 text-center text-sm text-indigo-600 font-medium">{message}</p>}
      </div>
    </div>
  );
};

const FinishSignUp = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const finish = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
          email = window.prompt('Please provide your email for confirmation');
        }
        if (email) {
          try {
            await signInWithEmailLink(auth, email, window.location.href);
            window.localStorage.removeItem('emailForSignIn');
            navigate('/');
          } catch (error) {
            console.error(error);
          }
        }
      }
    };
    finish();
  }, [navigate]);
  return <div className="p-8 text-center">Completing sign in...</div>;
};
const Profile = () => {
  const { user, login, logout } = useContext(AuthContext);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <UserIcon className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Profile</h2>
        <p className="text-gray-600 mb-6">Track your deals, earnings, and saved interests.</p>
        <Link to="/login" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold">
          Login to globcox
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24 md:pt-24">
      <div className="flex items-center space-x-4 mb-8">
        <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center text-2xl font-bold text-indigo-700">
          {user.displayName[0]}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{user.displayName}</h1>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium flex items-center">
              <ShieldCheck className="w-3 h-3 mr-1" />
              Verified Seller
            </span>
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium flex items-center">
              <Zap className="w-3 h-3 mr-1" />
              {user.streak} Day Streak
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-indigo-600 rounded-2xl p-4 text-white shadow-lg shadow-indigo-100">
          <p className="text-xs opacity-80 mb-1">Total Earnings</p>
          <p className="text-xl font-bold">MK {user.earnings.toLocaleString()}</p>
          <p className="text-[10px] opacity-60 mt-1">Keep it up! 🚀</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Saved This Week</p>
          <p className="text-xl font-bold text-indigo-600">MK {user.savings.toLocaleString()}</p>
          <p className="text-[10px] text-indigo-500 mt-1">Smart trading! 💡</p>
        </div>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="font-bold text-gray-900 mb-3">My Interests</h2>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.slice(0, 4).map(c => (
              <span key={c} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">{c}</span>
            ))}
            <button className="text-indigo-600 text-sm font-medium">+ Add More</button>
          </div>
        </section>

        <section className="bg-gray-50 rounded-2xl p-4">
          <h2 className="font-bold text-gray-900 mb-2">USSD Fallback</h2>
          <p className="text-xs text-gray-500 mb-3">No data? Use our USSD code to post or buy items on feature phones.</p>
          <div className="bg-white border border-gray-200 rounded-xl p-3 font-mono text-center text-lg font-bold text-indigo-700">
            *384*123#
          </div>
        </section>

        <button onClick={logout} className="w-full text-red-500 font-medium py-3 border border-red-100 rounded-xl">
          Log Out
        </button>
      </div>
    </div>
  );
};

const ChatList = () => {
  const { user, login } = useContext(AuthContext);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'chats'));
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Chats</h2>
        <p className="text-gray-600 mb-6">Login to see your conversations with buyers and sellers.</p>
        <button onClick={login} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold">
          Login to globcox
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24 md:pt-24">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>
      <div className="space-y-3">
        {chats.length === 0 && !loading && (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <p className="text-gray-500">No active chats yet.</p>
            <Link to="/" className="text-indigo-600 font-bold mt-2 inline-block">Start Browsing</Link>
          </div>
        )}
        {chats.map((chat) => (
          <Link
            key={chat.id}
            to={`/chat/${chat.id}`}
            className="flex items-center space-x-4 p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-700">
              {chat.lastMessage[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <h3 className="font-bold text-gray-900 truncate">Chat with Seller</h3>
                <span className="text-[10px] text-gray-400">
                  {chat.updatedAt?.toDate ? chat.updatedAt.toDate().toLocaleDateString() : 'Just now'}
                </span>
              </div>
              <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  return (
    <AuthProvider>
      <LowDataProvider>
        <Router>
          <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
            <Navbar />
            <main className="pb-16 md:pb-0">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/post" element={<PostProduct />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/chats" element={<ChatList />} />
                <Route path="/chat/:id" element={<ChatRoom />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/login" element={<Login />} />
                <Route path="/finishSignUp" element={<FinishSignUp />} />
              </Routes>
            </main>
          </div>
        </Router>
      </LowDataProvider>
    </AuthProvider>
  );
}
