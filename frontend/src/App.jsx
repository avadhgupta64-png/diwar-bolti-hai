
import { useState, useEffect } from 'react'
import io from 'socket.io-client'
const BACKEND_URL = 'https://diwar-bolti-hai.onrender.com'
export default function App(){
  const [status,setStatus]=useState('SAFE')
  const [logs,setLogs]=useState([])
  const [buildingId,setBuildingId]=useState('LaxmiNagar-Block4')
  useEffect(()=>{
    const socket=io(BACKEND_URL)
    socket.on('connect',()=>{socket.emit('register_phone',{buildingId,pillarId:'dashboard',phoneId:'dash-'+Math.random().toString(36).slice(2)})})
    socket.on('building_warning',d=>{setStatus('WARNING'); setLogs(l=>[`WARNING ${d.message}`,...l])})
    socket.on('building_danger',d=>{setStatus('DANGER'); setLogs(l=>[`DANGER ${d.message}`,...l])})
    return()=>socket.disconnect()
  },[buildingId])
  return(<div style={{minHeight:'100vh',padding:20,background:status==='DANGER'?'red':'#000',color:'#fff'}}><h1>Diwar Bolti Hai</h1><div style={{padding:20,background:'green',borderRadius:10}}>Status: {status}</div><input value={buildingId} onChange={e=>setBuildingId(e.target.value)} style={{padding:10,width:'90%',marginTop:20}}/><div style={{marginTop:20,background:'#111',padding:10}}>{logs.map((l,i)=><div key={i}>{l}</div>)}</div></div>)
}
