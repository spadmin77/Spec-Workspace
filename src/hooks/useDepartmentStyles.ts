const styleMap = [
  { bg: 'bg-blue-50/70 hover:bg-blue-50', text: 'text-blue-800', badge: 'bg-blue-100 text-blue-800 border-blue-200', border: 'border-blue-100' },
  { bg: 'bg-purple-50/70 hover:bg-purple-50', text: 'text-purple-800', badge: 'bg-purple-100 text-purple-800 border-purple-200', border: 'border-purple-100' },
  { bg: 'bg-amber-50/70 hover:bg-amber-50', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-800 border-amber-200', border: 'border-amber-100' },
  { bg: 'bg-emerald-50/70 hover:bg-emerald-50', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', border: 'border-emerald-100' },
  { bg: 'bg-pink-50/70 hover:bg-pink-50', text: 'text-pink-800', badge: 'bg-pink-100 text-pink-800 border-pink-200', border: 'border-pink-100' },
  { bg: 'bg-sky-50/70 hover:bg-sky-50', text: 'text-sky-800', badge: 'bg-sky-100 text-sky-800 border-sky-200', border: 'border-sky-100' },
  { bg: 'bg-slate-50 hover:bg-slate-100/70', text: 'text-slate-800', badge: 'bg-slate-100 text-slate-800 border-slate-200', border: 'border-slate-100' },
  { bg: 'bg-indigo-50/70 hover:bg-indigo-50', text: 'text-indigo-800', badge: 'bg-indigo-100 text-indigo-800 border-indigo-200', border: 'border-indigo-100' },
  { bg: 'bg-rose-50/70 hover:bg-rose-50', text: 'text-rose-800', badge: 'bg-rose-100 text-rose-800 border-rose-200', border: 'border-rose-100' },
  { bg: 'bg-teal-50/70 hover:bg-teal-50', text: 'text-teal-800', badge: 'bg-teal-100 text-teal-800 border-teal-200', border: 'border-teal-100' },
]

const keywordMap: ([string, number])[] = [
  ['it', 0], ['tech', 0], ['ማህደር', 0],
  ['human', 1], ['hr', 1], ['ሰው', 1],
  ['finance', 2], ['accounting', 2], ['ገንዘብ', 2],
  ['engineer', 3], ['dev', 3], ['ልማት', 3],
  ['market', 4], ['sales', 4], ['ሽያጭ', 4],
  ['admin', 5], ['operation', 5], ['አስተዳደር', 5],
]

export function useDepartmentStyles(dept: string) {
  const d = (dept || '').trim().toLowerCase()
  for (const [kw, idx] of keywordMap) {
    if (d.includes(kw)) return styleMap[idx]
  }
  let sum = 0
  for (let i = 0; i < d.length; i++) sum += d.charCodeAt(i)
  return styleMap[6 + (sum % 4)]
}
