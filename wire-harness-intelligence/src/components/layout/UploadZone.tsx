import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Timer, TerminalSquare, Cpu, Image as ImageIcon, ServerCrash, FileUp, CheckCircle2, Zap } from 'lucide-react';
import { useStore } from '../../store/useStore';

type LogEntry = { time: string; text: string; type: 'info' | 'success' | 'error' | 'highlight' };

const LOG_COLORS: Record<LogEntry['type'], string> = {
  info:      '#475569',
  highlight: '#3B9EFF',
  success:   '#00E5A0',
  error:     '#FF4757',
};

export const UploadZone = () => {
  const { setAppState, setData } = useStore();
  const [isDragging,   setIsDragging]   = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [elapsedTime,  setElapsedTime]  = useState('0.00');
  const [logs,         setLogs]         = useState<LogEntry[]>([]);

  const fileInputRef   = useRef<HTMLInputElement>(null);
  const timerRef       = useRef<number | null>(null);
  const logTimeoutsRef = useRef<number[]>([]);
  const logEndRef      = useRef<HTMLDivElement>(null);

  useEffect(() => () => clearAllTimers(), []);
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  const clearAllTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    logTimeoutsRef.current.forEach(clearTimeout);
    logTimeoutsRef.current = [];
  };

  const addLog = (text: string, delay: number, type: LogEntry['type'] = 'info') => {
    const id = window.setTimeout(() => {
      setLogs(p => [...p, { time: (delay / 1000).toFixed(2), text, type }]);
    }, delay);
    logTimeoutsRef.current.push(id);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid JPG, PNG, PDF, or SVG file.');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setLogs([{ time: '0.00', text: 'Initializing extraction pipeline…', type: 'info' }]);
    setElapsedTime('0.00');
    clearAllTimers();

    const startTime = Date.now();
    timerRef.current = window.setInterval(() => {
      setElapsedTime(((Date.now() - startTime) / 1000).toFixed(2));
    }, 50);

    try {
      addLog(`Uploaded ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, 200, 'info');
      addLog('OpenCV: Normalizing document format…', 800);
      addLog('OpenCV: Adaptive thresholding & binarization…', 1800);
      addLog('OpenCV: Extracting topological wire map…', 3000, 'highlight');
      addLog('Gemini Vision: Booting language model…', 4200);
      addLog('Gemini Vision: Analyzing spatial coordinates…', 5500, 'highlight');
      addLog('Gemini Vision: Tracing electrical paths…', 7000, 'highlight');
      addLog('Parsing confidence scores…', 8500);

      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('http://localhost:8000/api/extract', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || 'Vision analysis failed unexpectedly.');
      }
      const result = await res.json();
      if (result.error) throw new Error(result.error);

      clearAllTimers();
      const finalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      setLogs(p => [...p, { time: finalTime, text: 'Netlist compiled successfully. Redirecting…', type: 'success' }]);
      setTimeout(() => { setData(result); setAppState('dashboard'); }, 800);
    } catch (err: any) {
      clearAllTimers();
      const failTime = ((Date.now() - startTime) / 1000).toFixed(2);
      setLogs(p => [...p, { time: failTime, text: 'Process terminated with error.', type: 'error' }]);
      setError(err.message === 'Failed to fetch'
        ? 'Connection failed. Ensure the Python backend is running on port 8000.'
        : err.message);
      setIsProcessing(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
  };

  const getErrorIcon = () => {
    if (!error) return null;
    if (error.includes('format') || error.includes('JPG') || error.includes('PNG'))
      return <ImageIcon size={24} style={{ color: '#FF4757' }} />;
    if (error.includes('Connection'))
      return <ServerCrash size={24} style={{ color: '#FF4757' }} />;
    return <Cpu size={24} style={{ color: '#FF4757' }} />;
  };

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center p-8 relative overflow-hidden"
      style={{ background: 'var(--canvas)' }}
    >
      {/* Background dot grid */}
      <div className="absolute inset-0 canvas-grid pointer-events-none opacity-50" />

      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(59,158,255,0.06) 0%, transparent 65%)' }} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="text-center mb-10 z-10 relative"
      >
        {/* Logo mark */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-5 mx-auto"
          style={{
            background: 'linear-gradient(135deg, #3B9EFF22, #A78BFA22)',
            border: '1px solid rgba(59,158,255,0.25)',
            boxShadow: '0 0 24px rgba(59,158,255,0.15)',
          }}>
          <Zap size={22} style={{ color: '#3B9EFF' }} />
        </div>

        <h1 className="text-2xl font-bold text-slate-100 tracking-tight font-display mb-2">
          AI Vision Extraction
        </h1>
        <p className="text-[13px] text-slate-500 max-w-sm mx-auto leading-relaxed">
          Upload a legacy wire harness schematic. Our Gemini-powered pipeline extracts
          the netlist, connections, and 3D coordinates automatically.
        </p>
      </motion.div>

      <div className="z-10 relative w-full max-w-xl space-y-4">

        {/* Drop zone */}
        {!isProcessing && !error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className="relative w-full h-60 rounded-2xl flex flex-col items-center justify-center
                       cursor-pointer transition-all duration-200"
            style={isDragging
              ? {
                  border: '2px dashed #3B9EFF',
                  background: 'rgba(59,158,255,0.08)',
                  boxShadow: '0 0 40px rgba(59,158,255,0.25)',
                }
              : {
                  border: '2px dashed rgba(255,255,255,0.10)',
                  background: 'var(--surface)',
                  boxShadow: 'none',
                }
            }
          >
            <input
              type="file"
              accept="image/jpeg,image/png,application/pdf,image/svg+xml"
              ref={fileInputRef}
              className="hidden"
              onChange={e => e.target.files && handleFileUpload(e.target.files[0])}
            />

            <div
              className="p-4 rounded-2xl mb-4 transition-all duration-200"
              style={isDragging
                ? { background: '#3B9EFF', color: 'white', boxShadow: '0 0 20px rgba(59,158,255,0.5)' }
                : { background: 'rgba(255,255,255,0.05)', color: '#475569' }
              }
            >
              <FileUp size={28} />
            </div>

            <h3 className="text-sm font-bold text-slate-300 mb-1 font-display">
              {isDragging ? 'Drop to analyze' : 'Drop your schematic here'}
            </h3>
            <p className="text-[11px] text-slate-600">
              or <span className="text-brand hover:text-brand-light transition-colors cursor-pointer">click to browse</span>
            </p>
            <p className="text-[10px] text-slate-700 mt-4 uppercase tracking-widest font-medium">
              JPG · PNG · PDF · SVG
            </p>
          </motion.div>
        )}

        {/* Processing terminal */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-2xl overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)',
                     boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
          >
            {/* Terminal chrome */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ background: 'var(--surface-active)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF4757' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FFB020' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#00E5A0' }} />
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <TerminalSquare size={12} />
                  <span className="text-[11px] font-semibold">AETHER Extraction Pipeline</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5" style={{ color: '#3B9EFF' }}>
                <Timer size={12} className="animate-pulse" />
                <span className="font-mono text-xs font-bold">{elapsedTime}s</span>
              </div>
            </div>

            {/* Log output */}
            <div className="p-5 h-52 overflow-y-auto custom-scrollbar font-mono text-xs leading-relaxed space-y-2">
              <AnimatePresence initial={false}>
                {logs.map((log, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-3"
                  >
                    <span className="text-slate-700 shrink-0 w-10 text-right font-mono">{log.time}s</span>
                    <span style={{ color: LOG_COLORS[log.type] }}>{log.text}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              <motion.div
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.7 }}
                className="w-2 h-3.5 inline-block rounded-sm"
                style={{ background: '#3B9EFF' }}
              />
              <div ref={logEndRef} />
            </div>
          </motion.div>
        )}

        {/* Error state */}
        {error && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full rounded-2xl p-8 flex flex-col items-center text-center"
            style={{
              background: 'var(--surface)',
              border: '1px solid rgba(255,71,87,0.20)',
              boxShadow: '0 0 32px rgba(255,71,87,0.08)',
            }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(255,71,87,0.10)', border: '1px solid rgba(255,71,87,0.20)' }}>
              {getErrorIcon()}
            </div>
            <h3 className="text-sm font-bold text-slate-200 mb-2 font-display">Extraction Failed</h3>
            <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">{error}</p>
            <button onClick={() => setError(null)} className="btn-secondary gap-2">
              <AlertCircle size={13} />
              Try Again
            </button>
          </motion.div>
        )}

        {/* Format hints */}
        {!isProcessing && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-6 pt-2"
          >
            {['JPG / PNG', 'PDF Schematics', 'SVG Diagrams'].map(format => (
              <div key={format} className="flex items-center gap-1.5 text-[10px] text-slate-600 font-medium">
                <CheckCircle2 size={11} style={{ color: '#00E5A0' }} />
                {format}
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};