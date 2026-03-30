'use client'
import { useState, useEffect, useCallback } from 'react'

const CATEGORIES = [
  'Electricity','Gas','Water','Internet','Rent','Contents Insurance','Parking',
  'Shared Groceries','Cleaning Supplies','Toiletries','Kitchen Consumables',
  'Repairs/Maintenance','Laundry','Other'
]
const MONTHS = ['All','January','February','March','April','May','June','July','August','September','October','November','December']
const YEARS = ['2024','2025','2026','2027']

type Expense = { id:number; date:string; paid_by:string; category:string; description:string; amount:string; jacopo_share:string; amin_share:string; split:string }
type Reimbursement = { id:number; date:string; paid_by:string; to_person:string; amount:string; note:string }
type Summary = { byCategory:Record<string,{total:number;jacopo_owes:number;amin_owes:number}>; totals:{jacopo_paid:number;amin_paid:number;jacopo_owes:number;amin_owes:number;jacopo_reimbursed:number;amin_reimbursed:number;net:number} }

const fmt = (n:number) => `NZD ${Math.abs(n).toFixed(2)}`
const today = () => new Date().toISOString().split('T')[0]

export default function Home() {
  const [tab, setTab] = useState<'dashboard'|'expenses'|'reimbursements'>('dashboard')
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()+1])
  const [year, setYear] = useState('2026')
  const [summary, setSummary] = useState<Summary|null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{msg:string;ok:boolean}|null>(null)
  const [eDate,setEDate] = useState(today())
  const [ePaidBy,setEPaidBy] = useState('Jacopo')
  const [eCat,setECat] = useState('Rent')
  const [eDesc,setEDesc] = useState('')
  const [eAmount,setEAmount] = useState('')
  const [eSplit,setESplit] = useState('50/50')
  const [eSubmitting,setESubmitting] = useState(false)
  const [rDate,setRDate] = useState(today())
  const [rFrom,setRFrom] = useState('Jacopo')
  const [rTo,setRTo] = useState('Amin')
  const [rAmount,setRAmount] = useState('')
  const [rNote,setRNote] = useState('')
  const [rSubmitting,setRSubmitting] = useState(false)

  const showToast = (msg:string, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3000) }

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const params = `month=${month}&year=${year}`
    try {
      const [s,e,r] = await Promise.all([
        fetch(`/api/summary?${params}`).then(r=>r.json()),
        fetch(`/api/expenses?${params}`).then(r=>r.json()),
        fetch(`/api/reimbursements?${params}`).then(r=>r.json()),
      ])
      setSummary(s); setExpenses(e); setReimbursements(r)
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
      setEAmount(''); setEDesc('')
      fetchAll(); showToast(`✓ ${eCat} NZD ${parseFloat(eAmount).toFixed(2)} added`)
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
      setRAmount(''); setRNote('')
      fetchAll(); showToast(`✓ Reimbursement NZD ${parseFloat(rAmount).toFixed(2)} recorded`)
    } catch { showToast('Error adding reimbursement',false) }
    setRSubmitting(false)
  }

  async function delExpense(id:number) { if(!confirm('Delete?')) return; await fetch(`/api/expenses?id=${id}`,{method:'DELETE'}); fetchAll() }
  async function delReimb(id:number) { if(!confirm('Delete?')) return; await fetch(`/api/reimbursements?id=${id}`,{method:'DELETE'}); fetchAll() }

  const net = summary?.totals.net ?? 0
  const settled = Math.abs(net) < 0.01


  return (
    <div style={{maxWidth:900,margin:'0 auto',padding:'20px 16px',minHeight:'100vh',fontFamily:'system-ui,sans-serif',background:'#0f1117',color:'#e8eaf6'}}>
      {toast && <div style={{position:'fixed',top:20,right:20,zIndex:100,background:toast.ok?'#166534':'#7f1d1d',color:'#fff',padding:'12px 20px',borderRadius:10,fontSize:14,fontWeight:600,boxShadow:'0 4px 20px rgba(0,0,0,.4)'}}>{toast.msg}</div>}

      <div style={{textAlign:'center',marginBottom:28}}>
        <div style={{fontSize:28,fontWeight:800}}>🏠 Apartment Expenses</div>
        <div style={{color:'#8b92b4',fontSize:14,marginTop:4}}>Jacopo & Amin · Wellington</div>
      </div>

      <div style={{display:'flex',gap:12,marginBottom:20,background:'#1a1d27',border:'1px solid #2e3347',borderRadius:12,padding:'14px 16px',flexWrap:'wrap',alignItems:'center'}}>
        <span style={{color:'#8b92b4',fontSize:13,fontWeight:600}}>Filter:</span>
        <select style={{background:'#22263a',border:'1px solid #2e3347',color:'#e8eaf6',borderRadius:8,padding:'8px 12px'}} value={month} onChange={e=>setMonth(e.target.value)}>
          {MONTHS.map(m=><option key={m}>{m}</option>)}
        </select>
        <select style={{background:'#22263a',border:'1px solid #2e3347',color:'#e8eaf6',borderRadius:8,padding:'8px 12px'}} value={year} onChange={e=>setYear(e.target.value)}>
          {YEARS.map(y=><option key={y}>{y}</option>)}
        </select>
        {loading && <span style={{color:'#8b92b4',fontSize:13}}>Loading…</span>}
      </div>

      {summary && (
        <div style={{padding:'16px 20px',marginBottom:20,background:settled?'#145224':net>0?'#1e3a5f':'#4c1d1d',border:`1px solid ${settled?'#166534':net>0?'#1d4ed8':'#dc2626'}`,borderRadius:12,display:'flex',alignItems:'center',gap:12}}>
          <div style={{fontSize:24}}>{settled?'✅':net>0?'💙':'❤️'}</div>
          <div>
            <div style={{fontWeight:700,fontSize:16}}>{settled?'All settled!':net>0?`Amin owes Jacopo ${fmt(net)}`:`Jacopo owes Amin ${fmt(net)}`}</div>
            <div style={{color:'#8b92b4',fontSize:12,marginTop:2}}>Jacopo paid {fmt(summary.totals.jacopo_paid)} · Amin paid {fmt(summary.totals.amin_paid)}</div>
          </div>
        </div>
      )}

      <div style={{display:'flex',gap:4,marginBottom:20,background:'#1a1d27',borderRadius:10,padding:4,border:'1px solid #2e3347'}}>
        {(['dashboard','expenses','reimbursements'] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:'9px 0',fontSize:13,fontWeight:600,background:tab===t?'#4f7cff':'transparent',color:tab===t?'#fff':'#8b92b4',border:'none',borderRadius:8,cursor:'pointer',textTransform:'capitalize'}}>
            {t==='dashboard'?'📊 Summary':t==='expenses'?'➕ Expenses':'💸 Reimburse'}
          </button>
        ))}
      </div>

      {tab==='dashboard' && summary && (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
            {[{label:'Jacopo owes',val:summary.totals.jacopo_owes,color:'#3b82f6'},{label:'Amin owes',val:summary.totals.amin_owes,color:'#8b5cf6'}].map(({label,val,color})=>(
              <div key={label} style={{background:'#1a1d27',border:'1px solid #2e3347',borderRadius:12,padding:'16px 20px'}}>
                <div style={{color:'#8b92b4',fontSize:12,marginBottom:6}}>{label}</div>
                <div style={{fontSize:22,fontWeight:800,color}}>{fmt(val)}</div>
              </div>
            ))}
          </div>
          <div style={{background:'#1a1d27',border:'1px solid #2e3347',borderRadius:12,overflow:'hidden'}}>
            <div style={{padding:'14px 16px',borderBottom:'1px solid #2e3347',fontWeight:700,fontSize:13,color:'#8b92b4',display:'grid',gridTemplateColumns:'1fr 100px 100px 100px',gap:8}}>
              <span>Category</span><span style={{textAlign:'right'}}>Total</span><span style={{textAlign:'right'}}>Jacopo</span><span style={{textAlign:'right'}}>Amin</span>
            </div>
            {CATEGORIES.map((cat,i)=>{
              const row=summary.byCategory[cat]; if(!row||row.total===0) return null
              return <div key={cat} style={{padding:'12px 16px',display:'grid',gridTemplateColumns:'1fr 100px 100px 100px',gap:8,alignItems:'center',fontSize:14,background:i%2===0?'transparent':'rgba(255,255,255,.02)',borderBottom:'1px solid #2e3347'}}>
                <span>{cat}</span>
                <span style={{textAlign:'right',fontWeight:600}}>{row.total.toFixed(2)}</span>
                <span style={{textAlign:'right',color:'#3b82f6'}}>{row.jacopo_owes.toFixed(2)}</span>
                <span style={{textAlign:'right',color:'#8b5cf6'}}>{row.amin_owes.toFixed(2)}</span>
              </div>
            })}
            <div style={{padding:'14px 16px',display:'grid',gridTemplateColumns:'1fr 100px 100px 100px',gap:8,background:'#22263a',fontWeight:800,fontSize:14}}>
              <span>TOTAL</span>
              <span style={{textAlign:'right'}}>{(summary.totals.jacopo_owes+summary.totals.amin_owes).toFixed(2)}</span>
              <span style={{textAlign:'right',color:'#3b82f6'}}>{summary.totals.jacopo_owes.toFixed(2)}</span>
              <span style={{textAlign:'right',color:'#8b5cf6'}}>{summary.totals.amin_owes.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {tab==='expenses' && (
        <div>
          <div style={{background:'#1a1d27',border:'1px solid #2e3347',borderRadius:12,padding:20,marginBottom:20}}>
            <div style={{fontWeight:700,marginBottom:16,fontSize:15}}>➕ Add Expense</div>
            <form onSubmit={addExpense}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                {[['Date','date',eDate,setEDate,'date'],['Paid by','paid_by',ePaidBy,setEPaidBy,'select-person'],['Category','cat',eCat,setECat,'select-cat'],['Amount (NZD)','amount',eAmount,setEAmount,'number'],['Split','split',eSplit,setESplit,'select-split'],['Description','desc',eDesc,setEDesc,'text']].map(([label,,val,setter,type])=>(
                  <div key={String(label)}>
                    <label style={{fontSize:12,color:'#8b92b4',display:'block',marginBottom:4}}>{String(label)}</label>
                    {type==='select-person'?<select style={{background:'#22263a',border:'1px solid #2e3347',color:'#e8eaf6',borderRadius:8,padding:'8px 12px',width:'100%'}} value={String(val)} onChange={e=>(setter as (v:string)=>void)(e.target.value)}><option>Jacopo</option><option>Amin</option></select>
                    :type==='select-cat'?<select style={{background:'#22263a',border:'1px solid #2e3347',color:'#e8eaf6',borderRadius:8,padding:'8px 12px',width:'100%'}} value={String(val)} onChange={e=>(setter as (v:string)=>void)(e.target.value)}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select>
                    :type==='select-split'?<select style={{background:'#22263a',border:'1px solid #2e3347',color:'#e8eaf6',borderRadius:8,padding:'8px 12px',width:'100%'}} value={String(val)} onChange={e=>(setter as (v:string)=>void)(e.target.value)}><option>50/50</option><option>Jacopo</option><option>Amin</option></select>
                    :<input type={type==='date'?'date':type==='number'?'number':'text'} step={type==='number'?'0.01':undefined} min={type==='number'?'0.01':undefined} placeholder={type==='number'?'0.00':type==='text'?'e.g. March bill':undefined} style={{background:'#22263a',border:'1px solid #2e3347',color:'#e8eaf6',borderRadius:8,padding:'8px 12px',width:'100%'}} value={String(val)} onChange={e=>(setter as (v:string)=>void)(e.target.value)} required={type!=='text'}/>}
                  </div>
                ))}
              </div>
              {eAmount&&parseFloat(eAmount)>0&&<div style={{background:'#22263a',borderRadius:8,padding:'10px 14px',marginBottom:12,fontSize:13,color:'#8b92b4'}}>Jacopo: <b style={{color:'#3b82f6'}}>NZD {eSplit==='50/50'?(parseFloat(eAmount)/2).toFixed(2):eSplit==='Jacopo'?parseFloat(eAmount).toFixed(2):'0.00'}</b> · Amin: <b style={{color:'#8b5cf6'}}>NZD {eSplit==='50/50'?(parseFloat(eAmount)/2).toFixed(2):eSplit==='Amin'?parseFloat(eAmount).toFixed(2):'0.00'}</b></div>}
              <button type="submit" disabled={eSubmitting} style={{width:'100%',padding:'12px',background:'#4f7cff',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:600,cursor:'pointer'}}>{eSubmitting?'Adding…':'Add Expense'}</button>
            </form>
          </div>
          <div style={{background:'#1a1d27',border:'1px solid #2e3347',borderRadius:12,overflow:'hidden'}}>
            <div style={{padding:'14px 16px',borderBottom:'1px solid #2e3347',fontWeight:700,fontSize:13,color:'#8b92b4'}}>{expenses.length} expense{expenses.length!==1?'s':''}</div>
            {expenses.length===0&&<div style={{padding:32,textAlign:'center',color:'#8b92b4'}}>No expenses for this period.</div>}
            {expenses.map((exp,i)=>(
              <div key={exp.id} style={{padding:'12px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid #2e3347',fontSize:13,background:i%2===0?'transparent':'rgba(255,255,255,.02)'}}>
                <div>
                  <div style={{fontWeight:600}}>{exp.category}{exp.description&&<span style={{color:'#8b92b4',fontWeight:400}}> · {exp.description}</span>}</div>
                  <div style={{color:'#8b92b4',fontSize:12,marginTop:2}}>{exp.date?.toString().slice(0,10)} · Paid by <b>{exp.paid_by}</b> · Split: {exp.split}</div>
                  <div style={{fontSize:12,marginTop:2}}><span style={{color:'#3b82f6'}}>J: {parseFloat(exp.jacopo_share).toFixed(2)}</span><span style={{color:'#8b92b4'}}> / </span><span style={{color:'#8b5cf6'}}>A: {parseFloat(exp.amin_share).toFixed(2)}</span></div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <span style={{fontWeight:700,fontSize:15}}>NZD {parseFloat(exp.amount).toFixed(2)}</span>
                  <button onClick={()=>delExpense(exp.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#8b92b4',fontSize:16,padding:4}} title="Delete">🗑</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==='reimbursements' && (
        <div>
          <div style={{background:'#1a1d27',border:'1px solid #2e3347',borderRadius:12,padding:20,marginBottom:20}}>
            <div style={{fontWeight:700,marginBottom:16,fontSize:15}}>💸 Add Reimbursement</div>
            <form onSubmit={addReimbursement}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={{fontSize:12,color:'#8b92b4',display:'block',marginBottom:4}}>Date</label><input type="date" style={{background:'#22263a',border:'1px solid #2e3347',color:'#e8eaf6',borderRadius:8,padding:'8px 12px',width:'100%'}} value={rDate} onChange={e=>setRDate(e.target.value)} required/></div>
                <div><label style={{fontSize:12,color:'#8b92b4',display:'block',marginBottom:4}}>Amount (NZD)</label><input type="number" step="0.01" min="0.01" placeholder="0.00" style={{background:'#22263a',border:'1px solid #2e3347',color:'#e8eaf6',borderRadius:8,padding:'8px 12px',width:'100%'}} value={rAmount} onChange={e=>setRAmount(e.target.value)} required/></div>
                <div><label style={{fontSize:12,color:'#8b92b4',display:'block',marginBottom:4}}>Paid by (paying back)</label><select style={{background:'#22263a',border:'1px solid #2e3347',color:'#e8eaf6',borderRadius:8,padding:'8px 12px',width:'100%'}} value={rFrom} onChange={e=>{setRFrom(e.target.value);setRTo(e.target.value==='Jacopo'?'Amin':'Jacopo')}}><option>Jacopo</option><option>Amin</option></select></div>
                <div><label style={{fontSize:12,color:'#8b92b4',display:'block',marginBottom:4}}>To (who receives)</label><select style={{background:'#22263a',border:'1px solid #2e3347',color:'#e8eaf6',borderRadius:8,padding:'8px 12px',width:'100%'}} value={rTo} onChange={e=>setRTo(e.target.value)}><option>Jacopo</option><option>Amin</option></select></div>
                <div style={{gridColumn:'1/-1'}}><label style={{fontSize:12,color:'#8b92b4',display:'block',marginBottom:4}}>Note (optional)</label><input type="text" placeholder="e.g. March settlement" style={{background:'#22263a',border:'1px solid #2e3347',color:'#e8eaf6',borderRadius:8,padding:'8px 12px',width:'100%'}} value={rNote} onChange={e=>setRNote(e.target.value)}/></div>
              </div>
              <button type="submit" disabled={rSubmitting} style={{width:'100%',padding:'12px',background:'#7c3aed',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:600,cursor:'pointer'}}>{rSubmitting?'Recording…':'Record Reimbursement'}</button>
            </form>
          </div>
          <div style={{background:'#1a1d27',border:'1px solid #2e3347',borderRadius:12,overflow:'hidden'}}>
            <div style={{padding:'14px 16px',borderBottom:'1px solid #2e3347',fontWeight:700,fontSize:13,color:'#8b92b4'}}>{reimbursements.length} reimbursement{reimbursements.length!==1?'s':''}</div>
            {reimbursements.length===0&&<div style={{padding:32,textAlign:'center',color:'#8b92b4'}}>No reimbursements for this period.</div>}
            {reimbursements.map((r,i)=>(
              <div key={r.id} style={{padding:'12px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid #2e3347',fontSize:13,background:i%2===0?'transparent':'rgba(255,255,255,.02)'}}>
                <div>
                  <div style={{fontWeight:600}}>{r.paid_by} → {r.to_person}{r.note&&<span style={{color:'#8b92b4',fontWeight:400}}> · {r.note}</span>}</div>
                  <div style={{color:'#8b92b4',fontSize:12,marginTop:2}}>{r.date?.toString().slice(0,10)}</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <span style={{fontWeight:700,fontSize:15,color:'#22c55e'}}>NZD {parseFloat(r.amount).toFixed(2)}</span>
                  <button onClick={()=>delReimb(r.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#8b92b4',fontSize:16,padding:4}} title="Delete">🗑</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
