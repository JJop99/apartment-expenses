'use client'
import { useState, useEffect, useCallback } from 'react'

const CATEGORIES = ['Electricity & Internet','Rent','Shared Groceries','Cleaning Supplies','Kitchen Consumables','Other']
const MONTHS = ['All','January','February','March','April','May','June','July','August','September','October','November','December']
const YEARS = ['2024','2025','2026','2027']

type Entry = { id:number; date:string; paid_by:string; category:string; description:string; amount:string; jacopo_share:string; amin_share:string; split:string; type:string }
type Summary = { byCategory:Record<string,{total:number;jacopo_owes:number;amin_owes:number}>; totals:{jacopo_paid:number;amin_paid:number;jacopo_owes:number;amin_owes:number;jacopo_reimbursed:number;amin_reimbursed:number;net:number} }

const fmt = (n:number) => `NZD ${Math.abs(n).toFixed(2)}`
const fmtDate = (d:string) => new Date(d).toLocaleDateString('en-NZ',{day:'numeric',month:'short'})
const today = () => new Date().toISOString().split('T')[0]
const C = (s:React.CSSProperties) => s

export default function Home() {
  const [tab, setTab] = useState<'dashboard'|'expenses'|'reimbursements'>('dashboard')
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()+1])
  const [year, setYear] = useState('2026')
  const [summary, setSummary] = useState<Summary|null>(null)
  const [expenses, setExpenses] = useState<Entry[]>([])
  const [reimbursements, setReimbursements] = useState<Entry[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{msg:string;ok:boolean}|null>(null)
  const [eDate,setEDate] = useState(today()); const [ePaidBy,setEPaidBy] = useState('Jacopo')
  const [eCat,setECat] = useState('Rent'); const [eDesc,setEDesc] = useState('')
  const [eAmount,setEAmount] = useState(''); const [eSplit,setESplit] = useState('50/50')
  const [eSubmitting,setESubmitting] = useState(false)
  const [rDate,setRDate] = useState(today()); const [rFrom,setRFrom] = useState('Jacopo')
  const [rTo,setRTo] = useState('Amin'); const [rAmount,setRAmount] = useState('')
  const [rNote,setRNote] = useState(''); const [rSubmitting,setRSubmitting] = useState(false)

  const showToast = (msg:string,ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3000) }

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const p = `month=${month}&year=${year}`
    try {
      const [s,e,r] = await Promise.all([
        fetch(`/api/summary?${p}&_=${Date.now()}`,{cache:'no-store'}).then(r=>r.json()),
        fetch(`/api/expenses?${p}&_=${Date.now()}`,{cache:'no-store'}).then(r=>r.json()),
        fetch(`/api/reimbursements?${p}&_=${Date.now()}`,{cache:'no-store'}).then(r=>r.json()),
      ])
      setSummary(s); setExpenses(Array.isArray(e)?e:[]); setReimbursements(Array.isArray(r)?r:[])
    } catch { showToast('Error loading data',false) }
    setLoading(false)
  },[month,year])

  useEffect(()=>{ fetchAll() },[fetchAll])

  async function addExpense(e:React.FormEvent) {
    e.preventDefault()
    if(!eAmount||parseFloat(eAmount)<=0) return showToast('Enter a valid amount',false)
    setESubmitting(true)
    try {
      const res = await fetch('/api/expenses',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date:eDate,paid_by:ePaidBy,category:eCat,description:eDesc,amount:eAmount,split:eSplit})})
      if(!res.ok) throw new Error()
      setEAmount(''); setEDesc(''); fetchAll()
      showToast(`✓ ${eCat} NZD ${parseFloat(eAmount).toFixed(2)} added`)
    } catch { showToast('Error adding expense',false) }
    setESubmitting(false)
  }

  async function addReimbursement(e:React.FormEvent) {
    e.preventDefault()
    if(!rAmount||parseFloat(rAmount)<=0) return showToast('Enter a valid amount',false)
    if(rFrom===rTo) return showToast('Cannot reimburse yourself',false)
    setRSubmitting(true)
    try {
      const res = await fetch('/api/reimbursements',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date:rDate,paid_by:rFrom,to_person:rTo,amount:rAmount,note:rNote})})
      if(!res.ok) throw new Error()
      setRAmount(''); setRNote(''); fetchAll()
      showToast(`✓ Reimbursement NZD ${parseFloat(rAmount).toFixed(2)} recorded`)
    } catch { showToast('Error',false) }
    setRSubmitting(false)
  }

  async function delEntry(id:number,type:string) {
    if(!confirm('Delete?')) return
    await fetch(`/api/${type==='expense'?'expenses':'reimbursements'}?id=${id}`,{method:'DELETE'})
    fetchAll()
  }

  const net = summary?.totals.net ?? 0
  const settled = Math.abs(net) < 0.01

  // Merge all transactions for dashboard view, sorted by date desc
  const allTransactions = [...expenses, ...reimbursements].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const bg = '#0f1117', card = '#1a1d27', card2 = '#22263a', border = '#2e3347'
  const text = '#e8eaf6', muted = '#8b92b4', blue = '#3b82f6', purple = '#8b5cf6'
  const green = '#22c55e', accent = '#4f7cff'

  const inputS = C({background:card2,border:`1px solid ${border}`,color:text,borderRadius:8,padding:'8px 12px',width:'100%',fontSize:14})
  const labelS = C({fontSize:12,color:muted,display:'block',marginBottom:4,fontWeight:600})

  return (
    <div style={{maxWidth:900,margin:'0 auto',padding:'20px 16px',minHeight:'100vh',fontFamily:'system-ui,sans-serif',background:bg,color:text}}>
      {toast && <div style={{position:'fixed',top:20,right:20,zIndex:100,background:toast.ok?'#166534':'#7f1d1d',color:'#fff',padding:'12px 20px',borderRadius:10,fontSize:14,fontWeight:600,boxShadow:'0 4px 20px rgba(0,0,0,.4)'}}>{toast.msg}</div>}

      <div style={{textAlign:'center',marginBottom:24}}>
        <div style={{fontSize:26,fontWeight:800}}>🏠 Apartment Expenses</div>
        <div style={{color:muted,fontSize:13,marginTop:4}}>Jacopo & Amin · Wellington</div>
      </div>

      {/* Filter */}
      <div style={{display:'flex',gap:10,marginBottom:16,background:card,border:`1px solid ${border}`,borderRadius:12,padding:'12px 16px',flexWrap:'wrap',alignItems:'center'}}>
        <span style={{color:muted,fontSize:12,fontWeight:600}}>Filter:</span>
        <select style={{...inputS,width:'auto'}} value={month} onChange={e=>setMonth(e.target.value)}>
          {MONTHS.map(m=><option key={m}>{m}</option>)}
        </select>
        <select style={{...inputS,width:'auto'}} value={year} onChange={e=>setYear(e.target.value)}>
          {YEARS.map(y=><option key={y}>{y}</option>)}
        </select>
        {loading && <span style={{color:muted,fontSize:12}}>Loading…</span>}
      </div>

      {/* Settlement banner */}
      {summary && (
        <div style={{padding:'14px 18px',marginBottom:16,background:settled?'#145224':net>0?'#1e3a5f':'#4c1d1d',border:`1px solid ${settled?'#166534':net>0?'#1d4ed8':'#dc2626'}`,borderRadius:12,display:'flex',alignItems:'center',gap:12}}>
          <div style={{fontSize:22}}>{settled?'✅':net>0?'💙':'❤️'}</div>
          <div>
            <div style={{fontWeight:700,fontSize:15}}>{settled?'All settled!':net>0?`Amin owes Jacopo ${fmt(net)}`:`Jacopo owes Amin ${fmt(net)}`}</div>
            <div style={{color:muted,fontSize:12,marginTop:2}}>
              Jacopo paid {fmt(summary.totals.jacopo_paid)} · Amin paid {fmt(summary.totals.amin_paid)}
              {(summary.totals.jacopo_reimbursed>0||summary.totals.amin_reimbursed>0) && ` · Reimb: J→A ${fmt(summary.totals.jacopo_reimbursed)} / A→J ${fmt(summary.totals.amin_reimbursed)}`}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{display:'flex',gap:4,marginBottom:16,background:card,borderRadius:10,padding:4,border:`1px solid ${border}`}}>
        {(['dashboard','expenses','reimbursements'] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:'8px 0',fontSize:13,fontWeight:600,background:tab===t?accent:'transparent',color:tab===t?'#fff':muted,border:'none',borderRadius:7,cursor:'pointer'}}>
            {t==='dashboard'?'📊 Summary':t==='expenses'?'➕ Expenses':'💸 Reimburse'}
          </button>
        ))}
      </div>

      {/* ── DASHBOARD ── */}
      {tab==='dashboard' && (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>

          {/* Totals grid */}
          {summary && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {[{label:'Jacopo owes (share)',val:summary.totals.jacopo_owes,color:blue},{label:'Amin owes (share)',val:summary.totals.amin_owes,color:purple}].map(({label,val,color})=>(
                <div key={label} style={{background:card,border:`1px solid ${border}`,borderRadius:12,padding:'14px 18px'}}>
                  <div style={{color:muted,fontSize:11,marginBottom:4,fontWeight:600}}>{label}</div>
                  <div style={{fontSize:20,fontWeight:800,color}}>{fmt(val)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Category breakdown */}
          {summary && Object.keys(summary.byCategory).length > 0 && (
            <div style={{background:card,border:`1px solid ${border}`,borderRadius:12,overflow:'hidden'}}>
              <div style={{padding:'12px 16px',borderBottom:`1px solid ${border}`,fontWeight:700,fontSize:13}}>📋 By Category</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 90px 90px 90px',gap:6,padding:'8px 16px',fontSize:11,color:muted,fontWeight:600,borderBottom:`1px solid ${border}`}}>
                <span>Category</span><span style={{textAlign:'right'}}>Total</span><span style={{textAlign:'right',color:blue}}>Jacopo</span><span style={{textAlign:'right',color:purple}}>Amin</span>
              </div>
              {CATEGORIES.map(cat=>{
                const row=summary.byCategory[cat]; if(!row||row.total===0) return null
                return <div key={cat} style={{display:'grid',gridTemplateColumns:'1fr 90px 90px 90px',gap:6,padding:'9px 16px',fontSize:13,borderBottom:`1px solid rgba(255,255,255,.04)`}}>
                  <span>{cat}</span>
                  <span style={{textAlign:'right',fontWeight:600}}>{row.total.toFixed(2)}</span>
                  <span style={{textAlign:'right',color:blue}}>{row.jacopo_owes.toFixed(2)}</span>
                  <span style={{textAlign:'right',color:purple}}>{row.amin_owes.toFixed(2)}</span>
                </div>
              })}
              {summary && (
                <div style={{display:'grid',gridTemplateColumns:'1fr 90px 90px 90px',gap:6,padding:'10px 16px',fontSize:13,fontWeight:800,background:card2}}>
                  <span>TOTAL</span>
                  <span style={{textAlign:'right'}}>{(summary.totals.jacopo_owes+summary.totals.amin_owes).toFixed(2)}</span>
                  <span style={{textAlign:'right',color:blue}}>{summary.totals.jacopo_owes.toFixed(2)}</span>
                  <span style={{textAlign:'right',color:purple}}>{summary.totals.amin_owes.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* All transactions */}
          <div style={{background:card,border:`1px solid ${border}`,borderRadius:12,overflow:'hidden'}}>
            <div style={{padding:'12px 16px',borderBottom:`1px solid ${border}`,fontWeight:700,fontSize:13}}>
              🕐 All Transactions ({allTransactions.length})
            </div>
            {allTransactions.length===0 && <div style={{padding:32,textAlign:'center',color:muted,fontSize:13}}>No transactions for this period.</div>}
            {allTransactions.map((entry,i)=>{
              const isReimb = entry.type==='reimbursement'
              const paidByColor = entry.paid_by==='Jacopo'?blue:purple
              return (
                <div key={`${entry.type}-${entry.id}`} style={{padding:'10px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:`1px solid rgba(255,255,255,.04)`,fontSize:13,background:i%2===0?'transparent':'rgba(255,255,255,.015)'}}>
                  <div style={{display:'flex',gap:10,alignItems:'center',flex:1,minWidth:0}}>
                    <div style={{fontSize:16,flexShrink:0}}>{isReimb?'💸':'🧾'}</div>
                    <div style={{minWidth:0}}>
                      <div style={{fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                        {entry.category}
                        {entry.description&&<span style={{color:muted,fontWeight:400}}> · {entry.description}</span>}
                      </div>
                      <div style={{fontSize:11,color:muted,marginTop:1}}>
                        {fmtDate(entry.date)} · <span style={{color:paidByColor,fontWeight:600}}>{entry.paid_by}</span>
                        {!isReimb && <> · J: <span style={{color:blue}}>{parseFloat(entry.jacopo_share).toFixed(2)}</span> / A: <span style={{color:purple}}>{parseFloat(entry.amin_share).toFixed(2)}</span></>}
                      </div>
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
                    <span style={{fontWeight:700,fontSize:14,color:isReimb?green:text}}>
                      {isReimb?'+':''}NZD {parseFloat(entry.amount).toFixed(2)}
                    </span>
                    <button onClick={()=>delEntry(entry.id,entry.type)} style={{background:'rgba(239,68,68,.15)',border:'1px solid rgba(239,68,68,.3)',cursor:'pointer',color:'#ef4444',fontSize:12,padding:'4px 8px',borderRadius:6,fontWeight:600}} title="Delete">✕</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── EXPENSES TAB ── */}
      {tab==='expenses' && (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{background:card,border:`1px solid ${border}`,borderRadius:12,padding:18}}>
            <div style={{fontWeight:700,marginBottom:14,fontSize:14}}>➕ Add Expense</div>
            <form onSubmit={addExpense}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={labelS}>Date</label><input type="date" style={inputS} value={eDate} onChange={e=>setEDate(e.target.value)} required/></div>
                <div><label style={labelS}>Paid by</label><select style={inputS} value={ePaidBy} onChange={e=>setEPaidBy(e.target.value)}><option>Jacopo</option><option>Amin</option></select></div>
                <div><label style={labelS}>Category</label><select style={inputS} value={eCat} onChange={e=>setECat(e.target.value)}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
                <div><label style={labelS}>Amount (NZD)</label><input type="number" step="0.01" min="0.01" placeholder="0.00" style={inputS} value={eAmount} onChange={e=>setEAmount(e.target.value)} required/></div>
                <div><label style={labelS}>Split</label><select style={inputS} value={eSplit} onChange={e=>setESplit(e.target.value)}><option>50/50</option><option>Jacopo</option><option>Amin</option></select></div>
                <div><label style={labelS}>Description (optional)</label><input type="text" placeholder="e.g. March bill" style={inputS} value={eDesc} onChange={e=>setEDesc(e.target.value)}/></div>
              </div>
              {eAmount&&parseFloat(eAmount)>0&&<div style={{background:card2,borderRadius:8,padding:'8px 12px',marginBottom:12,fontSize:12,color:muted}}>
                Jacopo: <b style={{color:blue}}>NZD {eSplit==='50/50'?(parseFloat(eAmount)/2).toFixed(2):eSplit==='Jacopo'?parseFloat(eAmount).toFixed(2):'0.00'}</b>
                {' · '}Amin: <b style={{color:purple}}>NZD {eSplit==='50/50'?(parseFloat(eAmount)/2).toFixed(2):eSplit==='Amin'?parseFloat(eAmount).toFixed(2):'0.00'}</b>
              </div>}
              <button type="submit" disabled={eSubmitting} style={{width:'100%',padding:'11px',background:accent,color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:600,cursor:'pointer'}}>{eSubmitting?'Adding…':'Add Expense'}</button>
            </form>
          </div>
          <div style={{background:card,border:`1px solid ${border}`,borderRadius:12,overflow:'hidden'}}>
            <div style={{padding:'12px 16px',borderBottom:`1px solid ${border}`,color:muted,fontSize:12,fontWeight:600}}>{expenses.length} expense{expenses.length!==1?'s':''}</div>
            {expenses.length===0&&<div style={{padding:28,textAlign:'center',color:muted,fontSize:13}}>No expenses for this period.</div>}
            {expenses.map((exp,i)=>(
              <div key={exp.id} style={{padding:'11px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:`1px solid rgba(255,255,255,.04)`,fontSize:13,background:i%2===0?'transparent':'rgba(255,255,255,.015)'}}>
                <div>
                  <div style={{fontWeight:600}}>{exp.category}{exp.description&&<span style={{color:muted,fontWeight:400}}> · {exp.description}</span>}</div>
                  <div style={{fontSize:11,color:muted,marginTop:2}}>
                    {fmtDate(exp.date)} · <span style={{color:exp.paid_by==='Jacopo'?blue:purple,fontWeight:600}}>{exp.paid_by}</span> · {exp.split}
                    {' · '}J: <span style={{color:blue}}>{parseFloat(exp.jacopo_share).toFixed(2)}</span> / A: <span style={{color:purple}}>{parseFloat(exp.amin_share).toFixed(2)}</span>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontWeight:700,fontSize:14}}>NZD {parseFloat(exp.amount).toFixed(2)}</span>
                  <button onClick={()=>delEntry(exp.id,'expense')} style={{background:'rgba(239,68,68,.15)',border:'1px solid rgba(239,68,68,.3)',cursor:'pointer',color:'#ef4444',fontSize:12,padding:'4px 8px',borderRadius:6,fontWeight:600}}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── REIMBURSEMENTS TAB ── */}
      {tab==='reimbursements' && (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{background:card,border:`1px solid ${border}`,borderRadius:12,padding:18}}>
            <div style={{fontWeight:700,marginBottom:14,fontSize:14}}>💸 Add Reimbursement</div>
            <form onSubmit={addReimbursement}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={labelS}>Date</label><input type="date" style={inputS} value={rDate} onChange={e=>setRDate(e.target.value)} required/></div>
                <div><label style={labelS}>Amount (NZD)</label><input type="number" step="0.01" min="0.01" placeholder="0.00" style={inputS} value={rAmount} onChange={e=>setRAmount(e.target.value)} required/></div>
                <div><label style={labelS}>Paid by (paying back)</label><select style={inputS} value={rFrom} onChange={e=>{setRFrom(e.target.value);setRTo(e.target.value==='Jacopo'?'Amin':'Jacopo')}}><option>Jacopo</option><option>Amin</option></select></div>
                <div><label style={labelS}>To (who receives)</label><select style={inputS} value={rTo} onChange={e=>setRTo(e.target.value)}><option>Jacopo</option><option>Amin</option></select></div>
                <div style={{gridColumn:'1/-1'}}><label style={labelS}>Note (optional)</label><input type="text" placeholder="e.g. March settlement" style={inputS} value={rNote} onChange={e=>setRNote(e.target.value)}/></div>
              </div>
              <button type="submit" disabled={rSubmitting} style={{width:'100%',padding:'11px',background:'#7c3aed',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:600,cursor:'pointer'}}>{rSubmitting?'Recording…':'Record Reimbursement'}</button>
            </form>
          </div>
          <div style={{background:card,border:`1px solid ${border}`,borderRadius:12,overflow:'hidden'}}>
            <div style={{padding:'12px 16px',borderBottom:`1px solid ${border}`,color:muted,fontSize:12,fontWeight:600}}>{reimbursements.length} reimbursement{reimbursements.length!==1?'s':''}</div>
            {reimbursements.length===0&&<div style={{padding:28,textAlign:'center',color:muted,fontSize:13}}>No reimbursements for this period.</div>}
            {reimbursements.map((r,i)=>(
              <div key={r.id} style={{padding:'11px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:`1px solid rgba(255,255,255,.04)`,fontSize:13,background:i%2===0?'transparent':'rgba(255,255,255,.015)'}}>
                <div>
                  <div style={{fontWeight:600}}>{r.paid_by} → {r.category.replace('Reimbursement → ','')}{r.description&&<span style={{color:muted,fontWeight:400}}> · {r.description}</span>}</div>
                  <div style={{fontSize:11,color:muted,marginTop:2}}>{fmtDate(r.date)}</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontWeight:700,fontSize:14,color:green}}>NZD {parseFloat(r.amount).toFixed(2)}</span>
                  <button onClick={()=>delEntry(r.id,'reimbursement')} style={{background:'rgba(239,68,68,.15)',border:'1px solid rgba(239,68,68,.3)',cursor:'pointer',color:'#ef4444',fontSize:12,padding:'4px 8px',borderRadius:6,fontWeight:600}}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
