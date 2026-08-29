
import { useState, useEffect } from 'react'
import io from 'socket.io-client'
const BACKEND_URL = 'https://diwar-bolti-hai.onrender.com'
export default function App(){
  const [status,setStatus]=useState('SAFE')
  const [logs,setLogs]=useState([])
  const [buildingId,setBuildingId]=useState('LaxmiNagar-Block4')
  useEffect(()=>{
    const s=io(BACKEND_URL)
    s.on('connect',()=>{s.emit('register_phone',{buildingId,pillarId:'dashboard',phoneId:'dash-'+Math.random().toString(36).slice(2)})})
    s.on('building_warning',d=>{setStatus('WARNING'); setLogs(l=>[d.message,...l])})
    s.on('building_danger',d=>{setStatus('DANGER'); setLogs(l=>[d.message,...l])})
    return()=>s.disconnect()
  },[buildingId])
  return(<div style={{minHeight:'100vh',padding:20,background:status==='DANGER'?'red':'#000',color:'#fff'}}><h1>Diwar Bolti Hai</h1><h2 style={{background:status==='SAFE'?'green':'red',padding:20,borderRadius:10}}>Status: {status}</h2><input value={buildingId} onChange={e=>setBuildingId(e.target.value)} style={{padding:10,width:'90%'}}/><div style={{marginTop:20,background:'#111',padding:10}}>{logs.map((l,i)=><div key={i}>{l}</div>)}</div></div>)
}
