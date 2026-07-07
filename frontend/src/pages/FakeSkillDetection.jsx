import { useState } from 'react';
import { AI_SERVICE_URL } from '../config/apiConfig';
import { useTheme } from '../context/useTheme';

export default function FakeSkillDetection() {
  const { isDark } = useTheme();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f) => { if(f?.type==='application/pdf'){setFile(f);setError('');}else setError('PDF files only!'); };

  const handleSubmit = async () => {
    if(!file) return setError('Please select a PDF file');
    setLoading(true); setError('');
    try {
      const fd = new FormData(); fd.append('file',file);
      const res = await fetch(`${AI_SERVICE_URL}/api/fakeskill/detect`,{method:'POST',body:fd});
      const data = await res.json();
      if(!res.ok) throw new Error(data.detail||'Detection failed');
      setResult(data);
    } catch(err){ setError(err.message||'Detection failed'); }
    finally{ setLoading(false); }
  };

  const getScoreColor = (s) => s>=80?'#22c55e':s>=60?'#f59e0b':s>=40?'#f97316':'#ef4444';
  const getSeverityColor = (sev) => ({ high:'#ef4444',medium:'#f59e0b',low:'#3b82f6' })[sev?.toLowerCase()]||'#9ca3af';
  const getScoreLabel = (s) => s>=80?'Credible':s>=60?'Mostly Credible':s>=40?'Suspicious':'Low Credibility';

  const cardCls = 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl transition-colors';
  const shadow = { boxShadow:'0 1px 2px rgba(0,0,0,0.15), 0 8px 24px -12px rgba(0,0,0,0.25)' };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-4xl mx-auto p-6">
        {!result ? (
          <div className="space-y-4">
            <div className={cardCls} style={{...shadow,padding:24}}>
              <h2 style={{fontFamily:'Sora, sans-serif',fontSize:22,fontWeight:600,lineHeight:1.3}} className="text-gray-900 dark:text-white mb-1">Resume Credibility Check</h2>
              <p style={{fontFamily:'Inter, sans-serif',fontSize:14.5}} className="text-gray-500 dark:text-gray-400">AI detects exaggerated claims, unverified skills, and suspicious patterns in your resume</p>
            </div>

            <div className={cardCls} style={{...shadow,padding:32}}>
              <div
                onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                onDragLeave={()=>setDragOver(false)}
                onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}}
                onClick={()=>document.getElementById('fsdFileInput').click()}
                className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all"
                style={{borderColor:dragOver?'#ef4444':file?'#22c55e':isDark?'#374151':'#e5e7eb',backgroundColor:dragOver?(isDark?'#7f1d1d20':'#fef2f2'):'transparent'}}>
                <div className="text-4xl mb-3">{file?'✅':'🔍'}</div>
                {file
                  ? <><p style={{fontFamily:'Inter, sans-serif',fontWeight:600}} className="text-green-500">{file.name}</p><p style={{fontFamily:'Inter, sans-serif',fontSize:13}} className="text-gray-400 mt-1">{(file.size/1024).toFixed(1)} KB · Click to change</p></>
                  : <><p style={{fontFamily:'Inter, sans-serif',fontWeight:500,fontSize:14.5}} className="text-gray-700 dark:text-gray-300">Drop your resume PDF here</p><p style={{fontFamily:'Inter, sans-serif',fontSize:13}} className="text-gray-400 mt-1">or click to browse · Max 5MB</p></>}
                <input id="fsdFileInput" type="file" accept=".pdf" className="hidden" onChange={e=>handleFile(e.target.files[0])}/>
              </div>

              {error && <p style={{fontFamily:'Inter, sans-serif',fontSize:13.5}} className="text-red-500 mt-3 flex items-center gap-2"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</p>}

              <button onClick={handleSubmit} disabled={!file||loading}
                className="w-full mt-6 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white font-semibold py-3 transition-all"
                style={{fontFamily:'Inter, sans-serif',fontSize:14.5,fontWeight:600,borderRadius:12,boxShadow:'inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 8px rgba(239,68,68,0.3)'}}>
                {loading?<span className="flex items-center justify-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/><path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/></svg>Analyzing...</span>:'🔍 Detect Fake Skills'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className={cardCls} style={{...shadow,padding:24,textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                <p style={{fontFamily:'Inter, sans-serif',fontSize:13,letterSpacing:'0.04em',textTransform:'uppercase'}} className="text-gray-500 dark:text-gray-400 mb-4">Credibility Score</p>
                <div className="relative w-36 h-36 mb-4">
                  <svg viewBox="0 0 36 36" className="w-36 h-36 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke={isDark?'#1f2937':'#e5e7eb'} strokeWidth="3"/>
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke={getScoreColor(result.credibility_score)} strokeWidth="3" strokeDasharray={`${result.credibility_score} 100`} strokeLinecap="round"/>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span style={{fontFamily:'JetBrains Mono, monospace',fontSize:34,fontWeight:600,letterSpacing:'-0.02em',color:getScoreColor(result.credibility_score)}}>{result.credibility_score}</span>
                    <span style={{fontFamily:'Inter, sans-serif',fontSize:12}} className="text-gray-400">/ 100</span>
                  </div>
                </div>
                <span style={{fontFamily:'Inter, sans-serif',fontSize:13,fontWeight:600,backgroundColor:`${getScoreColor(result.credibility_score)}20`,color:getScoreColor(result.credibility_score),padding:'4px 16px',borderRadius:999,border:`1px solid ${getScoreColor(result.credibility_score)}40`}}>
                  {getScoreLabel(result.credibility_score)} · {result.verdict}
                </span>
              </div>

              <div className="space-y-3">
                <div className={cardCls} style={{...shadow,padding:20}}>
                  <p style={{fontFamily:'Inter, sans-serif',fontSize:12,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase'}} className="text-gray-500 dark:text-gray-400 mb-3">Summary</p>
                  {[['Red Flags',result.red_flags.length],['Suspicious Skills',result.suspicious_skills.length],['Without Evidence',result.skills_without_evidence.length],['Credible Skills',result.credible_skills.length]].map(([label,value])=>(
                    <div key={label} className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <span style={{fontFamily:'Inter, sans-serif',fontSize:13}} className="text-gray-600 dark:text-gray-400">{label}</span>
                      <span style={{fontFamily:'JetBrains Mono, monospace',fontSize:13,fontWeight:600}} className="text-gray-900 dark:text-white">{value}</span>
                    </div>
                  ))}
                </div>
                <div className={cardCls} style={{...shadow,padding:20}}>
                  <p style={{fontFamily:'Inter, sans-serif',fontSize:12,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase'}} className="text-gray-500 dark:text-gray-400 mb-2">Recommendation</p>
                  <p style={{fontFamily:'Inter, sans-serif',fontSize:13.5,lineHeight:1.6}} className="text-gray-600 dark:text-gray-400">{result.recommendation}</p>
                </div>
              </div>
            </div>

            {result.red_flags.length>0 && (
              <div className={cardCls} style={{...shadow,padding:24}}>
                <h3 style={{fontFamily:'Sora, sans-serif',fontWeight:600,fontSize:16}} className="text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="text-red-500">⚠️</span> Red Flags ({result.red_flags.length})
                </h3>
                <div className="space-y-2">
                  {result.red_flags.map((flag,i)=>(
                    <div key={i} className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                      <span style={{fontFamily:'Inter, sans-serif',fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:4,backgroundColor:`${getSeverityColor(flag.severity)}20`,color:getSeverityColor(flag.severity),border:`1px solid ${getSeverityColor(flag.severity)}40`,flexShrink:0,textTransform:'uppercase'}}>{flag.severity}</span>
                      <span style={{fontFamily:'Inter, sans-serif',fontSize:13.5,lineHeight:1.6}} className="text-gray-600 dark:text-gray-400">{flag.detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.suspicious_skills.length>0 && (
              <div className={cardCls} style={{...shadow,padding:24}}>
                <h3 style={{fontFamily:'Sora, sans-serif',fontWeight:600,fontSize:16}} className="text-gray-900 dark:text-white mb-3">⚡ Suspicious Skills</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.suspicious_skills.map((item,i)=>(
                    <div key={i} className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span style={{fontFamily:'Sora, sans-serif',fontWeight:600,fontSize:13}} className="text-gray-900 dark:text-white capitalize">{item.skill}</span>
                        <span style={{fontFamily:'Inter, sans-serif',fontSize:11,backgroundColor:'#f59e0b20',color:'#f59e0b',border:'1px solid #f59e0b40',borderRadius:4,padding:'1px 6px'}}>{item.claim}</span>
                      </div>
                      <p style={{fontFamily:'Inter, sans-serif',fontSize:12,lineHeight:1.5}} className="text-gray-500 dark:text-gray-400">{item.warning}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.skills_without_evidence.length>0 && (
              <div className={cardCls} style={{...shadow,padding:24}}>
                <h3 style={{fontFamily:'Sora, sans-serif',fontWeight:600,fontSize:16}} className="text-gray-900 dark:text-white mb-3">🔗 Skills Need More Context</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {result.skills_without_evidence.map((item,i)=>(
                    <span key={i} style={{fontFamily:'Inter, sans-serif',fontSize:12}} className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">{item.skill}</span>
                  ))}
                </div>
                <p style={{fontFamily:'Inter, sans-serif',fontSize:13}} className="text-gray-400">→ Add project descriptions or GitHub links to verify these skills</p>
              </div>
            )}

            {result.credible_skills.length>0 && (
              <div className={cardCls} style={{...shadow,padding:24}}>
                <h3 style={{fontFamily:'Sora, sans-serif',fontWeight:600,fontSize:16}} className="text-gray-900 dark:text-white mb-3 flex items-center gap-2"><span className="text-green-500">✓</span> Verified Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {result.credible_skills.map((skill,i)=>(
                    <span key={i} style={{fontFamily:'Inter, sans-serif',fontSize:12}} className="px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            <button onClick={()=>{setResult(null);setFile(null);}}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 transition-all"
              style={{fontFamily:'Inter, sans-serif',fontSize:14.5,fontWeight:600,borderRadius:12,boxShadow:'inset 0 1px 0 rgba(255,255,255,0.15)'}}>
              Check Another Resume
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
