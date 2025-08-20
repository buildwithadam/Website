import React, { useMemo, useState } from 'react'

const ITEMS = [
  {
    title: 'Bug Hunter DX+',
    href: '/bug-hunter.html',
    description: 'Protect the core in this web based MMO bug defense game.',
    tags: ['game']
  }
]

export default function Lab() {
  const [filter, setFilter] = useState('all')
  const tags = useMemo(() => {
    const set = new Set()
    ITEMS.forEach(i => i.tags.forEach(t => set.add(t)))
    return Array.from(set).sort()
  }, [])
  const visible = filter === 'all' ? ITEMS : ITEMS.filter(i => i.tags.includes(filter))
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-4">Lab</h1>
      <div className="mb-6 flex gap-2">
        <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded-full text-sm ${filter==='all' ? 'bg-white/20' : 'bg-white/10'}`}>All</button>
        {tags.map(t => (
          <button key={t} onClick={() => setFilter(t)} className={`px-3 py-1 rounded-full text-sm capitalize ${filter===t ? 'bg-white/20' : 'bg-white/10'}`}>{t}</button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map(item => (
          <a key={item.href} href={item.href} className="block bg-white/10 hover:bg-white/20 transition rounded-xl p-4">
            <h2 className="text-xl font-semibold mb-1">{item.title}</h2>
            <p className="text-sm opacity-80 mb-2">{item.description}</p>
            <div className="flex flex-wrap gap-1">
              {item.tags.map(tag => (
                <span key={tag} className="text-xs bg-white/20 px-2 py-0.5 rounded-full capitalize">{tag}</span>
              ))}
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
