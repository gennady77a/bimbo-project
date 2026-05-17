"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';

// Хелпер для безопасного рендеринга динамических иконок Lucide
const LucideIcon = ({ name, className }: { name: string; className?: string }) => {
  const IconComponent = (Icons as any)[name];
  if (!IconComponent) return <Icons.HelpCircle className={className} />;
  return <IconComponent className={className} />;
};

export default function Home() {
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState('shop'); // shop | admin
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Данные из БД
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [sysLogs, setSysLogs] = useState<any[]>([]);
  const [callLogs, setCallLogs] = useState<any[]>([]);

  // Форма добавления товара
  const [form, setForm] = useState({ title: '', price: '', description: '', imageUrl: '', badge: 'Новинка', color: '#22c55e' });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Эффект Дождя Матрицы
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const katakana = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789🔥⚡🤖🛒';
    const alphabet = katakana.split('');

    const fontSize = 14;
    const columns = canvas.width / fontSize;

    const rainDrops: number[] = [];
    for (let x = 0; x < columns; x++) {
      rainDrops[x] = 1;
    }

    const draw = () => {
      ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#22c55e';
      ctx.font = fontSize + 'px monospace';

      for (let i = 0; i < rainDrops.length; i++) {
        const text = alphabet[Math.floor(Math.random() * alphabet.length)];
        ctx.fillText(text, i * fontSize, rainDrops[i] * fontSize);

        if (rainDrops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          rainDrops[i] = 0;
        }
        rainDrops[i]++;
      }
    };

    const interval = setInterval(draw, 30);
    return () => clearInterval(interval);
  }, [isDark]);

  // Загрузка данных с бэкенда
  const fetchAllData = async () => {
    try {
      const pRes = await fetch('/api/products');
      const pData = await pRes.json();
      setProducts(pData);

      const lRes = await fetch('/api/logs');
      const lData = await lRes.json();
      setOrders(lData.orders || []);
      setSysLogs(lData.sysLogs || []);
      setCallLogs(lData.callLogs || []);
    } catch (e) {
      console.error("Ошибка загрузки данных", e);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [activeTab]);

  const addToCart = (product: any) => {
    setCart([...cart, product]);
  };

  const checkoutERIP = async () => {
    const totalSum = cart.reduce((acc, item) => acc + item.price, 0);
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sum: totalSum, cart })
      });
      alert(`Счет на сумму ${totalSum} BYN успешно выставлен в ЕРИП!`);
      setCart([]);
      setIsCartOpen(false);
      fetchAllData();
    } catch (e) {
      alert("Ошибка оформления");
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price)
        })
      });
      setForm({ title: '', price: '', description: '', imageUrl: '', badge: 'Новинка', color: '#22c55e' });
      fetchAllData();
    } catch (e) {
      alert("Ошибка добавления товара");
    }
  };

  return (
    <div className={`min-h-screen relative transition-colors duration-300 ${isDark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none opacity-20 z-0" />
      
      {/* ШАПКА САЙТА */}
      <header className="relative z-10 border-b border-zinc-800 backdrop-blur-md bg-opacity-70 p-4 max-w-7xl mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-black tracking-widest text-green-500">BIMBO.BY</h1>
        
        <nav className="flex gap-4 items-center">
          <button 
            onClick={() => setActiveTab('shop')} 
            className={`px-4 py-2 rounded-lg font-bold transition ${activeTab === 'shop' ? 'bg-green-500 text-black' : 'text-zinc-400 hover:text-white'}`}
          >
            Витрина
          </button>
          <button 
            onClick={() => setActiveTab('admin')} 
            className={`px-4 py-2 rounded-lg font-bold transition ${activeTab === 'admin' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            Админ-панель
          </button>
          
          <button onClick={() => setIsDark(!isDark)} className="p-2 border border-zinc-700 rounded-lg">
            <LucideIcon name={isDark ? "Sun" : "Moon"} className="w-5 h-5" />
          </button>

          <button onClick={() => setIsCartOpen(true)} className="p-2 bg-zinc-900 border border-zinc-700 text-white rounded-lg relative">
            <LucideIcon name="ShoppingBag" className="w-5 h-5" />
            {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-green-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">{cart.length}</span>}
          </button>
        </nav>
      </header>

      {/* ОСНОВНОЙ КОНТЕНТ */}
      <main className="relative z-10 max-w-7xl mx-auto p-4 py-8">
        {activeTab === 'shop' ? (
          <div>
            <h2 className="text-4xl font-extrabold mb-8 text-center bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">Премиальные товары</h2>
            {/* Bento Grid Сетка товаров */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {products.map((product, idx) => (
                <motion.div 
                  key={product.id}
                  whileHover={{ y: -5 }}
                  className={`border border-zinc-800 rounded-3xl p-6 bg-zinc-950 bg-opacity-80 backdrop-blur-md relative overflow-hidden flex flex-col justify-between h-[380px] ${idx % 3 === 0 ? 'md:col-span-2' : 'md:col-span-1'}`}
                  style={{ boxShadow: `0 10px 30px -15px ${product.color || '#22c55e'}40` }}
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="bg-green-500 text-black text-xs font-black uppercase px-2 py-1 rounded-full">{product.badge || 'VIP'}</span>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: product.color }} />
                    </div>
                    <h3 className="text-2xl font-bold mt-4">{product.title}</h3>
                    <p className="text-zinc-400 text-sm mt-2 line-clamp-3">{product.description}</p>
                  </div>

                  <div className="flex justify-between items-center mt-6">
                    <div>
                      <span className="text-xs text-zinc-500 block">Цена</span>
                      <span className="text-2xl font-black text-green-400">{product.price} BYN</span>
                    </div>
                    <button onClick={() => addToCart(product)} className="bg-white text-black font-bold px-4 py-2 rounded-xl hover:bg-green-500 hover:text-black transition flex items-center gap-2">
                      <LucideIcon name="Plus" className="w-4 h-4" /> В корзину
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          /* АДМИН ПАНЕЛЬ */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Левая колонка - Форма добавления */}
            <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800">
              <h3 className="text-xl font-bold mb-4 text-purple-400 flex items-center gap-2"><LucideIcon name="PlusCircle" className="w-5 h-5"/> Добавить девайс</h3>
              <form onSubmit={handleAddProduct} className="flex flex-col gap-4 text-black">
                <input type="text" placeholder="Название товара" required value={form.title} onChange={e=>setForm({...form, title:e.target.value})} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-purple-500"/>
                <input type="number" placeholder="Цена (BYN)" required value={form.price} onChange={e=>setForm({...form, price:e.target.value})} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-purple-500"/>
                <textarea placeholder="Описание товара (ИИ сделает его продающим)" required value={form.description} onChange={e=>setForm({...form, description:e.target.value})} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-purple-500 h-24"/>
                <input type="text" placeholder="Ссылка на фото (Unsplash URL)" value={form.imageUrl} onChange={e=>setForm({...form, imageUrl:e.target.value})} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-purple-500"/>
                <button type="submit" className="bg-purple-600 text-white font-bold p-3 rounded-xl hover:bg-purple-700 transition">Запустить ИИ-модерацию и выставить</button>
              </form>
            </div>

            {/* Средняя колонка - ЕРИП Транзакции и ИИ Логи */}
            <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 flex flex-col gap-6">
              <div>
                <h3 className="text-xl font-bold mb-4 text-green-400 flex items-center gap-2"><LucideIcon name="Receipt" className="w-5 h-5"/> Транзакции ЕРИП</h3>
                <div className="max-h-[220px] overflow-y-auto flex flex-col gap-2 pr-2">
                  {orders.map(o => (
                    <div key={o.id} className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 flex justify-between items-center">
                      <div>
                        <span className="text-xs text-zinc-500 block">{o.orderIdString}</span>
                        <span className="font-bold text-sm text-white">{o.sum} BYN</span>
                      </div>
                      <span className="text-xs bg-amber-500/20 text-amber-400 font-bold px-2 py-1 rounded-md">{o.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4 text-cyan-400 flex items-center gap-2"><LucideIcon name="ShieldCheck" className="w-5 h-5"/> Журнал ИИ-инспектора</h3>
                <div className="max-h-[220px] overflow-y-auto flex flex-col gap-2 pr-2">
                  {sysLogs.map(l => (
                    <div key={l.id} className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                      <div className="flex justify-between text-xs mb-1">
                        <span className={l.status === 'SUCCESS' ? 'text-green-400' : 'text-red-400'}>🟢 {l.status}</span>
                        <span className="text-zinc-500">{new Date(l.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-zinc-300">{l.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Правая колонка - Голосовой B2B Обзвон (Vapi.ai) */}
            <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800">
              <h3 className="text-xl font-bold mb-4 text-orange-400 flex items-center gap-2"><LucideIcon name="PhoneCall" className="w-5 h-5"/> B2B Обзвон (Vapi.ai)</h3>
              <div className="max-h-[480px] overflow-y-auto flex flex-col gap-3 pr-2">
                {callLogs.map(c => (
                  <div key={c.id} className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-sm text-white">{c.clientName}</h4>
                        <span className="text-xs text-zinc-500">{c.phone}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 font-bold rounded-md ${c.status === 'success_deal' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {c.status === 'success_deal' ? 'Успех' : 'Отказ'}
                      </span>
                    </div>
                    <div className="bg-black p-2 rounded-lg text-[11px] text-zinc-400">
                      <span className="text-orange-400 font-bold block mb-1">ИИ-Выжимка:</span>
                      {c.summary}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* БОКОВАЯ КОРЗИНА (Drawer) */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end"
            onClick={() => setIsCartOpen(false)}
          >
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'tween' }}
              className="w-full max-w-md bg-zinc-950 h-full p-6 border-l border-zinc-800 flex flex-col justify-between"
              onClick={e => e.stopPropagation()}
            >
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-white">Корзина покупок</h3>
                  <button onClick={() => setIsCartOpen(false)}><LucideIcon name="X" className="w-6 h-6"/></button>
                </div>
                
                <div className="flex flex-col gap-3 overflow-y-auto max-h-[70vh]">
                  {cart.map((item, index) => (
                    <div key={index} className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-sm">{item.title}</h4>
                        <span className="text-green-400 text-xs font-bold">{item.price} BYN</span>
                      </div>
                      <button onClick={() => setCart(cart.filter((_, i) => i !== index))} className="text-red-500 p-1 hover:bg-red-500/10 rounded-lg"><LucideIcon name="Trash2" className="w-4 h-4"/></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-4">
                <div className="flex justify-between font-bold text-lg mb-4">
                  <span>Итого:</span>
                  <span className="text-green-400">{cart.reduce((acc, item) => acc + item.price, 0)} BYN</span>
                </div>
                <button onClick={checkoutERIP} disabled={cart.length === 0} className="w-full bg-green-500 text-black font-black p-4 rounded-xl disabled:opacity-50 hover:bg-green-600 transition">
                  Оформить через ЕРИП
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}