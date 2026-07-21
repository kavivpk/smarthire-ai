const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/pages/LiveInterview.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add sectionPhase state
content = content.replace(
  "const [sessionStarted, setSessionStarted] = useState(false);",
  "const [sessionStarted, setSessionStarted] = useState(false);\n  const [sectionPhase, setSectionPhase] = useState('instructions'); // 'instructions' | 'active' | 'result'"
);

// 2. Update btn-start-ai handler
content = content.replace(
  "setAiSessionStage(aiSubMode === 'qa' ? 'technical' : aiSubMode);\n                setSessionStarted(false);\n                setStage('ai_interview');",
  "setAiSessionStage(aiSubMode === 'qa' ? 'technical' : aiSubMode);\n                setSectionPhase('instructions');\n                setSessionStarted(false);\n                setStage('ai_interview');"
);

// 3. Update onAptitudeComplete
content = content.replace(
  "const onAptitudeComplete = useCallback((result) => {\n    setAptResult(result);\n    // Advance to coding section\n    setAiSessionStage('coding');\n  }, []);",
  `const onAptitudeComplete = useCallback(async (result) => {
    setAptResult(result);
    setSectionPhase('result');
    try {
      await API.post('/interview/aptitude/email', { aptitudeResult: result });
    } catch (err) {
      console.error('Failed to send aptitude email', err);
    }
  }, []);`
);

// 4. Update onCodingComplete
content = content.replace(
  `const onCodingComplete = useCallback((results) => {
    const solved   = results.filter(r => (r.score || 0) >= 5).length;
    const avgScore = results.length
      ? Math.round(results.reduce((s, r) => s + (r.score || 0), 0) / results.length * 10) / 10
      : 0;
    setAiCodingResult({ solved, total: results.length, avgScore, results });
    // Advance to technical Q&A section
    setAiSessionStage('technical');
  }, []);`,
  `const onCodingComplete = useCallback(async (results) => {
    const solved   = results.filter(r => (r.score || 0) >= 5).length;
    const avgScore = results.length
      ? Math.round(results.reduce((s, r) => s + (r.score || 0), 0) / results.length * 10) / 10
      : 0;
    const codingRes = { solved, total: results.length, avgScore, results };
    setAiCodingResult(codingRes);
    setSectionPhase('result');
    try {
      await API.post('/interview/coding/email', { codingResult: codingRes });
    } catch (err) {
      console.error('Failed to send coding email', err);
    }
  }, []);`
);

// 5. Replace big render block
const blockStartStr = `    // Combined results screen \u2014 scores hidden, only email confirmation shown\n    if (aiSessionStage === 'complete' || sessionDisqualified) {`;
const blockEndStr = `// Session is active and content is ready \u2014 fall through to dedicated render blocks below.`;

const startIndex = content.indexOf(blockStartStr);
const endIndex = content.indexOf(blockEndStr);

if (startIndex !== -1 && endIndex !== -1) {
  const newBlock = `
    // Combined results screen
    if (aiSessionStage === 'complete' || sessionDisqualified) {
      return (
        <div className="min-h-screen bg-gray-950 p-4 md:p-8 flex items-center justify-center">
          <div className="max-w-lg w-full bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
            {sessionDisqualified && (
              <div className="rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <p className="text-red-400 font-bold text-base"> Session Disqualified</p>
                <p className="text-red-300 text-sm mt-1">Your session was terminated after {sessionViolations}/3 proctoring violations. Partial scores recorded.</p>
              </div>
            )}

            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(16,185,129,0.15))', border: '2px solid rgba(99,102,241,0.3)' }}>
                
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-white text-2xl font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>
                AI Interview Complete!
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Your interview session has ended. A detailed report with your scores has been sent to your registered email address.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl mx-auto"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 text-sm font-semibold">
                Full report emailed to {user.email || 'your registered address'}
              </span>
            </div>

            <p className="text-gray-500 text-xs">
              Check your inbox (and spam folder) for the complete score breakdown including Aptitude, Coding, and Technical Q&A results.
            </p>

            <button onClick={resetAll} className="w-full py-3.5 rounded-xl font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #6366f1, #ef4444)' }}>
               Return to Setup
            </button>
          </div>
        </div>
      );
    }

    // --- INSTRUCTIONS PHASE ---
    if (sectionPhase === 'instructions') {
      const sectionInfo = aiSessionStage === 'aptitude' ? { title: 'Aptitude Test', icon: '', desc: '20 multiple-choice questions testing logical reasoning.' }
        : aiSessionStage === 'coding' ? { title: 'Coding Round', icon: '', desc: 'Write and execute code to solve algorithmic challenges.' }
        : { title: 'Technical Q&A', icon: '', desc: 'AI-driven voice interview based on your resume.' };

      return (
        <div className="min-h-screen bg-gray-950 p-4 md:p-8 flex items-center justify-center">
          <div className="max-w-lg w-full bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(16,185,129,0.15))', border: '2px solid rgba(99,102,241,0.3)' }}>
                {sectionInfo.icon}
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-white text-2xl font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>{sectionInfo.title}</h2>
              <p className="text-gray-400 text-sm leading-relaxed">{sectionInfo.desc}</p>
            </div>
            
            {aiSessionStage === 'technical' && (
              <div className="bg-gray-800 p-4 rounded-xl text-left border border-gray-700">
                <p className="text-gray-300 text-sm font-medium mb-2"> Upload Resume (Required for Tech Q&A)</p>
                <div onClick={() => document.getElementById('aiQaResumeUpload').click()} className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors hover:border-indigo-500/50" style={{ borderColor: resumeFile ? '#10b981' : '#374151', background: resumeFile ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)' }}>
                  {resumeFile ? <p className="text-green-400 text-sm">{resumeFile.name}</p> : <p className="text-gray-400 text-sm">Click to browse (PDF)</p>}
                  <input id="aiQaResumeUpload" type="file" accept=".pdf" className="hidden" onChange={e => { if (e.target.files[0]) setResumeFile(e.target.files[0]); }} />
                </div>
              </div>
            )}
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-left">
              <p className="text-blue-400 text-sm font-semibold mb-2">Rules:</p>
              <ul className="text-blue-300/80 text-xs space-y-1 list-disc pl-4">
                <li>Fullscreen and Camera are required and will activate automatically.</li>
                <li>Do not switch tabs or exit fullscreen during the test.</li>
              </ul>
            </div>
            
            {error && <p className="text-red-400 text-sm">{error}</p>}
            
            <button onClick={() => {
              if (aiSessionStage === 'technical' && !resumeFile) {
                setError('Please upload your resume to continue.');
                return;
              }
              setError('');
              setSectionPhase('active');
              setSessionStarted(false);
            }} className="w-full py-3.5 rounded-xl font-semibold text-white transition-all" style={{ background: 'linear-gradient(135deg, #6366f1, #ef4444)' }}>
              I'm Ready - Start Section
            </button>
            <button onClick={resetAll} className="block mx-auto text-gray-500 text-xs hover:text-gray-400">Exit to Dashboard</button>
          </div>
        </div>
      );
    }

    // --- RESULT PHASE ---
    if (sectionPhase === 'result') {
      if (aiSessionStage === 'aptitude') {
        const aptData = aptResultRef.current || aptResult;
        const correct = aptData?.correct || 0;
        const total = aptData?.total || 0;
        const percent = total ? Math.round((correct/total)*100) : 0;
        return (
          <div className="min-h-screen bg-gray-950 p-4 md:p-8 flex items-center justify-center">
            <div className="max-w-lg w-full bg-gray-900 border border-gray-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
              <div className="text-5xl"></div>
              <h2 className="text-white text-2xl font-bold">Aptitude Section Complete</h2>
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                 <p className="text-gray-400 text-sm">Your Score</p>
                 <p className="text-4xl font-bold text-white mt-1">{correct} / {total}</p>
                 <p className="text-indigo-400 text-sm mt-1">{percent}%</p>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-semibold">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Result emailed to {user.email || 'you'}
              </div>
              <button onClick={() => { setAiSessionStage('coding'); setSectionPhase('instructions'); }} className="w-full py-3.5 rounded-xl font-semibold text-white transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #6366f1, #ef4444)' }}>
                Proceed to Coding Round
              </button>
              <button onClick={resetAll} className="block mx-auto text-gray-500 text-xs hover:text-gray-400">Exit</button>
            </div>
          </div>
        );
      }
      if (aiSessionStage === 'coding') {
        const codData = aiCodingResultRef.current || aiCodingResult;
        const solved = codData?.solved || 0;
        const total = codData?.total || 0;
        return (
          <div className="min-h-screen bg-gray-950 p-4 md:p-8 flex items-center justify-center">
            <div className="max-w-lg w-full bg-gray-900 border border-gray-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
              <div className="text-5xl"></div>
              <h2 className="text-white text-2xl font-bold">Coding Section Complete</h2>
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                 <p className="text-gray-400 text-sm">Problems Solved</p>
                 <p className="text-4xl font-bold text-white mt-1">{solved} / {total}</p>
                 <p className="text-amber-400 text-sm mt-1">Avg Score: {codData?.avgScore || 0}/10</p>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-semibold">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Result emailed to {user.email || 'you'}
              </div>
              <button onClick={() => { setAiSessionStage('technical'); setSectionPhase('instructions'); }} className="w-full py-3.5 rounded-xl font-semibold text-white transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #6366f1, #ef4444)' }}>
                Proceed to Technical Q&A
              </button>
              <button onClick={resetAll} className="block mx-auto text-gray-500 text-xs hover:text-gray-400">Exit</button>
            </div>
          </div>
        );
      }
    }

    // --- ACTIVE PHASE ---
    const showLoadingState = !sessionStarted || (aiSessionStage === 'aptitude' && aptitudeQuestions.length === 0);

    if (showLoadingState) {
      return (
        <ProctoringGuard
          testTitle={`AI Interview - ${aiSessionStage}`}
          onSessionStart={(info) => { setSessionStarted(true); setAiSessionStream(info?.stream || null); }}
          onDisqualified={handleAIDisqualified}
        >
          {sessionStarted && (
            <div className="min-h-screen bg-gray-950 flex flex-col">
              <AIProgress />
              {aiSessionStage === 'aptitude' && aptitudeQuestions.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <div className="text-white text-sm animate-pulse"> Loading aptitude questions...</div>
                    {error && (
                      <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 max-w-sm">
                        <p className="text-red-400 text-sm">{error}</p>
                        <button onClick={() => startAptitude()} className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 underline">Retry</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {aiSessionStage === 'technical' && resumeAnalyzing && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center gap-1.5 mb-4">
                      {[0,1,2,3].map(i => (
                        <div key={i} className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                    <p className="text-white text-sm"> Analysing resume, preparing questions...</p>
                  </div>
                </div>
              )}
              {aiSessionStage === 'technical' && !resumeAnalyzing && !socket && (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center">
                    <button onClick={startAiTechInterview} className="w-full max-w-xs py-3.5 px-6 rounded-xl font-bold text-white transition-all" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                       Begin Voice Interview
                    </button>
                  </div>
                </div>
              )}
              {aiSessionStage === 'technical' && !resumeAnalyzing && socket && stage !== 'interview' && (
                <div className="flex-1 flex items-center justify-center text-white text-sm animate-pulse">
                   Connecting to interview room...
                </div>
              )}
            </div>
          )}
        </ProctoringGuard>
      );
    }
    
    // Session is active and content is ready - fall through to dedicated render blocks below.`;
  
  content = content.substring(0, startIndex) + newBlock + content.substring(endIndex + blockEndStr.length);
}

// Ensure emojis are stripped per the user's instructions: "remove pannu only english mattum tha varanum"
// This regex strips all non-ASCII symbols that are typically emojis, to ensure English text only
// We will replace all common emojis used in this file
content = content.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|\u260E|\u2611|\u2705|\u26A0|\u274C|\u23F3|\u2699|\u2728|\u26A1|\u25B6|\u23F9|\u2192|\u2190|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]|\uD83E[\uDD00-\uDDFF]|??|??|???|??|??|??|??|??|??|?|??|??|??|?|???|??|??|??|??|??/g, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Update complete.');
