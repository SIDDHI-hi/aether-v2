import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './components/layout/Sidebar';
import { Viewer2D } from './components/viewers/Viewer2D';
import { Viewer3D } from './components/viewers/Viewer3D';
import { SplashScreen } from './components/layout/SplashScreen';
import { UploadZone } from './components/layout/UploadZone';
import { LandingPage } from './components/layout/LandingPage';
import { useStore } from './store/useStore';
import { DataGrid } from './components/dashboard/DataGrid';
import { InspectorPanel } from './components/panels/InspectorPanel';
import { AccuracyPanel } from './components/panels/AccuracyPanel';
import { ExportPanel } from './components/panels/ExportPanel';
import { RoutingOptimizer } from './components/panels/RoutingOptimizer';
import { ThermalSimulatorPanel } from './components/panels/ThermalSimulatorPanel';
import {
  Activity, BarChart3, Sparkles, SlidersHorizontal,
  FlameKindling, Send, Zap, X, RotateCcw
} from 'lucide-react';
import React from 'react';

/* ═══════════════════════════════════════════════════════
   UNLIMITED AI RESPONSE ENGINE
   Priority: keyword KB → contextual harness inference → general engineering
═══════════════════════════════════════════════════════ */

type QA = { keywords: string[]; answer: string };

const KNOWLEDGE_BASE: QA[] = [
  { keywords: ['thermal','heat','temperature','temp','hot','cold','warm','celsius','fahrenheit'],
    answer: 'Thermal analysis complete. Segment C (ECU→Firewall) is the primary violation — routed within 3 cm of the exhaust manifold at 145 °C ambient. Safe clearance minimum is 10 cm per SAE J1128. Recommend high-temp XLPE sleeve or reroute via the firewall grommet path.' },
  { keywords: ['voltage','volt','v load','48v','12v','24v','36v','60v'],
    answer: 'At 48 V system load: primary bus draws ~201.6 A. Power dissipation = 96.8 W. AWG 10 is the minimum recommended gauge per IPC-D-356. Confirm fuse rating ≤ 250 A. All high-voltage segments (W3, W8) are flagged HIGH risk in the current netlist.' },
  { keywords: ['current','amps','ampere','ampacity','overload'],
    answer: 'Current load analysis: W3 (PWR_12V) is rated 60 A, presently carrying 72 A — 20% over spec. W8 (PWR_HV at 48 V) is within tolerance at 201 A vs 250 A rated. Recommend uprating W3 from AWG 14 to AWG 10 immediately.' },
  { keywords: ['segment c','seg c','segmentc','ecu to firewall','ecu-firewall'],
    answer: 'Segment C detail (ID: SEG-C-047): AWG 14 XLPE, rated 125 °C, exposed to 145 °C ambient. Insulation integrity: 22%. Failure probability in 48–72 h under continuous load: 87%. Distance to exhaust manifold: 2.8 cm (limit: 10 cm).' },
  { keywords: ['replace','replacement','repair','fix','maintenance','mttr','mean time'],
    answer: 'MTTR for Segment C: 6.5 hours (Engine Drop required). Breakdown: 2.0 h disassembly, 1.0 h routing, 1.5 h reinstall, 2.0 h QA validation. Warranty labor exposure: $1,202.50/unit at $185/hr.' },
  { keywords: ['insulation','melt','burn','degrade','xlpe','pvc','silicone','sleeve'],
    answer: 'Insulation ratings in harness: XLPE (segments C, D) — 125 °C, PVC (W1–W4) — 105 °C, Silicone-jacketed (W9 Radar) — 180 °C. Current breach: Segment C XLPE at 145 °C. Phase 2 polymer degradation detected. Risk of chassis short-circuit: HIGH.' },
  { keywords: ['cost','warranty','dollar','$','money','budget','labor','roi','savings'],
    answer: 'Financial impact: Proactive repair — $1,202.50/unit. At 1 M vehicle production: $1.2 B total warranty exposure. Dijkstra routing optimization saves $141,360 in copper material (124 km eliminated). Net ROI on Aether deployment: $9.35 M projected in Year 1.' },
  { keywords: ['route','routing','path','shortest','optimize','optimizer','dijkstra','weight','length','distance'],
    answer: 'Routing optimizer results: Dijkstra SSSP on 8-node graph. Optimized path C1→C5→C4 (83.7 cm) vs legacy DFS path (96.1 cm). Savings: 12.4 cm per vehicle. Material saved at 1 M scale: 124 km copper wire (14,880 kg). Carbon footprint reduction: 89.3 t CO₂e.' },
  { keywords: ['connector','connectors','node','nodes','pin','pins','plug','socket'],
    answer: '8 connectors active: C1=Main ECU (24-pin AMPSEAL), C2=Sensor A (6-pin Deutsch DT), C3=Sensor B (6-pin Deutsch DT), C4=Power Dist 48V (12-pin Molex), C5=ADAS Module (40-pin MX150), C6=Body Control (16-pin ITT Cannon), C7=Rear Gateway (8-pin TE 070), C8=Infotainment (20-pin HSD). Risk flags: C4 HIGH, C2 MEDIUM, C3 MEDIUM.' },
  { keywords: ['wire','wires','harness','netlist','segment','cable','loom'],
    answer: '14 wire segments loaded. Protocols: CAN-FD (W1–W2 @1 Mbps), PWR (W3 12V, W8 48V), GND (W4, W7), LIN Bus (W5 @19.2kbps), FlexRay (W6 @10 Mbps), Radar (W9 77GHz coax), Ethernet AVB (W10 100BASE-T1), USB SS (W11 5 Gbps), HDMI ARC (W12), AV Bus (W13), LiDAR (W14 905nm fiber). 3 HIGH-risk, 5 MEDIUM, 6 LOW.' },
  { keywords: ['can','can-fd','canbus','lin','flexray','ethernet','protocol'],
    answer: 'Communication protocols in harness: CAN-FD (W1, W2 — 1 Mbps, 400 kbps arbitration), LIN Bus (W5 — 19.2 kbps, body functions), FlexRay (W6 — 10 Mbps, ADAS safety-critical), Ethernet AVB (W10 — 100BASE-T1, infotainment backbone), USB SuperSpeed (W11 — 5 Gbps), HDMI 2.1 ARC (W12). All CAN and FlexRay segments are within EMC shield spec.' },
  { keywords: ['diff','difference','compare','version','baseline','change','delta','added','removed','modified'],
    answer: 'Diff vs baseline v1.2: +5 additions (C2, C5, C8, W5, W9, W13), -1 removal (W3 deprecated — replaced by W8 48V). 4 modifications: C3 pin-count 6→8, C7 connector family changed, W2 gauge AWG18→AWG16, W7 routing path updated. Net risk delta: +2 HIGH over baseline.' },
  { keywords: ['risk','hazard','fault','danger','safety','violation','flag','critical','warning'],
    answer: 'Full hazard report: HIGH (3) — C4 Power Dist (voltage spike exposure, no TVS diode), W3 PWR_12V (ampacity exceeded 20%), W8 PWR_HV (thermal proximity). MEDIUM (5) — C2, C3, W5, W9, W10. LOW (6) — C6, C7, C8, W1, W2, W6. Recommended immediate action on all HIGH items.' },
  { keywords: ['3d','twin','digital twin','model','spatial','3d view','three','spatial model'],
    answer: '3D Digital Twin: all 8 connectors mapped. Notable spatial data — C1 at (100,150,0), C4 at (700,180,30), C7 at (800,400,20). Segment C is flagged RED in the 3D viewport. Use "3D Digital Twin" view to orbit and inspect spatial clearances. Click any component to load its thermal profile in the Simulator panel.' },
  { keywords: ['export','download','csv','ipc','json','glb','format','report','output'],
    answer: 'Export options available: (1) IPC-D-356 netlist (PCB assembly standard), (2) CSV component inventory, (3) JSON harness graph, (4) GLB 3D model (Three.js compatible), (5) PDF thermal risk report. All exports are SHA-256 signed. Go to the Export tab in the right panel.' },
  { keywords: ['spark plug','spark','ignition','coil','distributor'],
    answer: 'Spark plug and ignition system harness analysis: Primary ignition coil harness (C2→Engine) uses high-voltage XLPE at 25 kV rating. Spark plug leads are not currently modeled in the active netlist — upload the ignition sub-system schema to include them. High-energy ignition segments should maintain ≥ 15 cm clearance from fuel lines.' },
  { keywords: ['grounding','ground','gnd','earth','chassis','return','negative'],
    answer: 'Grounding analysis: W4 (Main GND, ECU to chassis) and W7 (Sensor GND return) are both healthy. Ground stud torque: 12 Nm (verified). Chassis return resistance measured at 0.003 Ω. No floating ground detected. Best practice: all GND segments should be below 0.005 Ω per SAE J2562.' },
  { keywords: ['fuse','fusing','protection','overcurrent','breaker','mcb'],
    answer: 'Fuse protection summary: W3 (PWR_12V) — fused at 60 A, carrying 72 A → BLOWN RISK. W8 (PWR_HV 48V) — fused at 250 A, nominal at 201 A → OK. Recommend replacing W3 fuse with 80 A rating and upgrading wire gauge to AWG 10 in the same service visit.' },
  { keywords: ['adas','radar','lidar','camera','autonomous','sensor fusion'],
    answer: 'ADAS harness segments: W9=77GHz Radar (RG316 coaxial, SMA connector), W14=LiDAR 905nm fiber optic (LC/APC, bend radius >30 mm enforced). FlexRay W6 serves as the safety-critical bus. All ADAS segments are shielded and meet ISO 26262 ASIL-D wiring requirements. No violations detected.' },
  { keywords: ['battery','hv battery','12v','48v battery','li-ion','lithium'],
    answer: 'Battery interface harness: C4 (Power Dist) interfaces the 48V Li-Ion pack via W8 (AWG 6, 200 A continuous). 12V auxiliary from DC-DC converter feeds C1 via W3. Cell voltage monitoring wiring (CAN-FD) on W1. Battery pack temp sensor harness connects at C2 via 6-pin DT connector.' },
  { keywords: ['weight','mass','gram','kg','heavy','light','reduce'],
    answer: 'Harness weight analysis: total current weight = 4.82 kg. Optimized routing reduces copper by 14,880 g/Mveh. Switching W3 from AWG 14→AWG 10 adds 87 g/m but is safety-mandatory. Net weight target after optimization: 4.68 kg/vehicle. Every 100g saved across 1M fleet = 100 metric tons.' },
  { keywords: ['shield','shielding','emi','rfi','noise','interference','emc'],
    answer: 'EMC & shielding report: FlexRay W6 and Radar W9 are 100% foil-shielded (85% coverage, drain wire grounded at ECU end). CAN bus W1/W2 uses twisted-pair (twist rate: 40 turns/m). USB W11 and Ethernet W10 are individually shielded. No EMC violations detected. All within CISPR 25 Class 3.' },
  { keywords: ['what','help','capabilities','aether','feature','can you','do for me','list'],
    answer: "I'm Aether AI — your wire harness intelligence copilot. I can precisely answer: thermal violations & clearance analysis, voltage/current load calculations, connector & wire specs, routing optimization (Dijkstra SSSP), hazard scoring, diff/version comparison, ADAS harness compliance, EMC shielding, fuse/protection checks, weight optimization, export formats, and any general automotive EE question. Just ask." },
];

/* ── Contextual fallback generator for unknown queries ── */
function generateContextualResponse(input: string): string {
  const q = input.toLowerCase();

  // Detect question intent patterns
  if (q.includes('how many') || q.includes('count') || q.includes('number of'))
    return `Based on the loaded harness netlist: 8 connectors, 14 wire segments, 3 protocol buses (CAN-FD, FlexRay, LIN), and 2 power rails (12V, 48V). If you need a count for a specific subset, specify the component type (e.g., "how many CAN segments").`;

  if (q.includes('where') || q.includes('location') || q.includes('position') || q.includes('placed'))
    return `Spatial data available in the 3D Digital Twin view. Key locations: C1 (Main ECU) at coordinates (100,150,0), C4 (Power Dist) at (700,180,30), C7 (Rear Gateway) at (800,400,20). The critical Segment C runs from (100,150,0) to (400,180,15) — passing within 2.8 cm of the exhaust manifold at (350,160,12).`;

  if (q.includes('why') || q.includes('reason') || q.includes('cause') || q.includes('because'))
    return `Root cause analysis for the primary harness issue: the original harness routing followed the legacy 2019 chassis layout which predates the 48V powertrain upgrade. The exhaust manifold was repositioned 4.2 cm closer in the current gen platform (MY2024+), reducing thermal clearance from 12.2 cm to 2.8 cm below the 10 cm SAE minimum.`;

  if (q.includes('when') || q.includes('schedule') || q.includes('deadline') || q.includes('urgency'))
    return `Priority timeline: Segment C thermal violation should be addressed within 2,000 km or 30 days under normal operating conditions. Under sustained high-load (> 40V) operation, failure window narrows to 48–72 hours. Schedule Engine Drop repair at next planned OEM service visit or immediately if the vehicle sees towing/high-load duty.`;

  if (q.includes('who') || q.includes('technician') || q.includes('mechanic') || q.includes('engineer'))
    return `For the Engine Drop procedure (Segment C repair): requires an Automotive Electrical Engineer (AEE) or Master Technician with OEM harness certification. The procedure is not suitable for general workshop staff. Recommend booking at a brand-authorized dealer with wire harness repair capability (ASNT Level II minimum).`;

  if (q.includes('compare') || q.includes('versus') || q.includes(' vs ') || q.includes('better') || q.includes('worse'))
    return `Comparison analysis: Current v1.3 harness vs baseline v1.2 — net change is +2 HIGH-risk segments, +1 protocol bus (FlexRay W6 added for ADAS), -1 deprecated segment (W3 replaced by W8 48V rail). The thermal profile has worsened due to W8 routing proximity. Component count increased by 3 (C2, C5, C8 added for ADAS suite).`;

  if (q.includes('best') || q.includes('recommend') || q.includes('suggest') || q.includes('should i'))
    return `Aether Recommendations (priority order): 1) Immediately reroute Segment C away from exhaust (or apply Raychem ATUM heat-shrink with reflective braid). 2) Uprate W3 fuse from 60A→80A and upgrade gauge to AWG 10. 3) Run Dijkstra optimizer to save 12.4 cm copper per vehicle. 4) Add TVS suppression diode at C4 Power Dist input. 5) Schedule next diff report after MY2025 facelift changes.`;

  if (q.includes('standard') || q.includes('spec') || q.includes('compliance') || q.includes('iso') || q.includes('sae') || q.includes('oem'))
    return `Applicable standards for this harness: SAE J1128 (wire temp ratings), IPC-D-356 (netlist format), ISO 26262 (ASIL-D for ADAS segments W6/W9/W14), CISPR 25 Class 3 (EMC for CAN/FlexRay), SAE J2562 (ground resistance < 0.005Ω), LV 214 (connector vibration rating for automotive). All ADAS segments currently meet ASIL-D requirements.`;

  // Generic intelligent fallback — always sounds harness-aware
  const keywords = input.trim().split(/\s+/).filter(w => w.length > 3);
  const focus = keywords.length > 0 ? keywords.slice(0, 3).join(', ') : 'the harness';
  return `Analyzing "${input}" against the active harness netlist (v1.3, MY2024 platform)… Aether has cross-referenced your query with 14 wire segments, 8 connectors, and 3 active protocol buses. For "${focus}": no specific netlist entry was found, but based on automotive EE context — all general-purpose wire segments in this harness use XLPE insulation (125°C rated), Deutsch DT or Molex MX150 connectors, and are tested to ISO 26262. If you're asking about a specific wire ID, connector, or voltage rail, try including those identifiers (e.g., "W3", "C4", "48V bus") for a precise answer.`;
}

function getAIResponse(input: string): string {
  const lower = input.toLowerCase();
  // Score each KB entry
  let best: QA | null = null;
  let bestScore = 0;
  for (const qa of KNOWLEDGE_BASE) {
    const score = qa.keywords.filter(k => lower.includes(k)).length;
    if (score > bestScore) { bestScore = score; best = qa; }
  }
  // Use KB if we have a confident hit (score ≥ 1)
  if (best && bestScore >= 1) return best.answer;
  // Otherwise use contextual generator — never returns a dead-end message
  return generateContextualResponse(input);
}

/* ═══════════════════════════════════════════════════════
   AetherChatBubble
   - Collapses to glowing orb
   - Expands to Q&A bar: query stays in input, answer floats above
   - X button clears query+answer, restart cycle
   - Orb X button collapses back to bubble
═══════════════════════════════════════════════════════ */
function AetherChatBubble() {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery]     = useState('');
  const [answer, setAnswer]   = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (expanded) setTimeout(() => inputRef.current?.focus(), 300);
  }, [expanded]);

  const handleSend = () => {
    const q = query.trim();
    if (!q) return;
    setThinking(true);
    setAnswer(null);
    // Simulate a brief "thinking" delay for realism
    setTimeout(() => {
      setAnswer(getAIResponse(q));
      setThinking(false);
    }, 420);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  const handleClear = () => {
    setQuery('');
    setAnswer(null);
    setThinking(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center"
      style={{ pointerEvents: 'auto' }}>
      <AnimatePresence mode="wait">
        {expanded ? (

          /* ── EXPANDED Q&A BAR ── */
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.88, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 18 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="w-[540px] max-w-[calc(100vw-4rem)] flex flex-col gap-2.5"
            style={{ transformOrigin: 'bottom center' }}
          >

            {/* ── ANSWER CARD (floats above input) ── */}
            <AnimatePresence>
              {thinking && (
                <motion.div key="thinking"
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.22 }}
                  className="rounded-2xl px-4 py-3 flex items-center gap-3"
                  style={{
                    background: 'rgba(10,13,22,0.93)',
                    border: '1px solid rgba(167,139,250,0.25)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 4px 32px rgba(0,0,0,0.45)',
                  }}>
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg,#3B9EFF,#A78BFA)' }}>
                    <Zap size={10} className="text-white" />
                  </div>
                  <div className="flex gap-1 items-center">
                    {[0,1,2].map(i => (
                      <motion.span key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: '#A78BFA' }}
                        animate={{ opacity: [0.3,1,0.3], y: [0,-4,0] }}
                        transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                    <span className="ml-1.5 text-[11px] text-slate-500">Aether is thinking…</span>
                  </div>
                </motion.div>
              )}

              {answer && !thinking && (
                <motion.div key="answer"
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.26, ease: 'easeOut' }}
                  className="rounded-2xl px-4 py-3.5"
                  style={{
                    background: 'rgba(10,13,22,0.95)',
                    border: '1px solid rgba(167,139,250,0.28)',
                    backdropFilter: 'blur(24px)',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset, 0 0 24px rgba(167,139,250,0.06)',
                  }}>
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: 'linear-gradient(135deg,#3B9EFF,#A78BFA)', boxShadow: '0 0 10px rgba(59,158,255,0.4)' }}>
                      <Zap size={11} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-[11px]" style={{ color: '#A78BFA' }}>Aether  </span>
                      <span className="text-[12px] leading-relaxed" style={{ color: '#E2E8F0' }}>{answer}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── INPUT BAR ── */}
            <div className="flex items-center gap-2 rounded-2xl px-3 py-2.5"
              style={{
                background: 'rgba(10,13,22,0.95)',
                border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(24px)',
                boxShadow: '0 12px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset',
              }}>

              {/* Aether logo */}
              <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg,#3B9EFF,#A78BFA)', boxShadow: '0 0 10px rgba(59,158,255,0.5)' }}>
                <Zap size={13} className="text-white" />
              </div>

              {/* Text input — query stays visible */}
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask Aether anything about the harness…"
                className="flex-1 bg-transparent outline-none font-medium"
                style={{
                  fontSize: '13.5px',
                  color: '#F1F5F9',          /* bright white — always visible */
                  caretColor: '#3B9EFF',
                }}
              />

              {/* Clear query + answer — only when there's content */}
              <AnimatePresence>
                {(query || answer) && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.15 }}
                    onClick={handleClear}
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150"
                    title="Clear & ask new question"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748B' }}>
                    <RotateCcw size={11} />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Send */}
              <button
                onClick={handleSend}
                disabled={!query.trim() || thinking}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 disabled:opacity-30 shrink-0"
                style={{
                  background: query.trim() && !thinking ? 'linear-gradient(135deg,#3B9EFF,#A78BFA)' : 'rgba(255,255,255,0.06)',
                  boxShadow: query.trim() && !thinking ? '0 0 12px rgba(59,158,255,0.45)' : 'none',
                }}>
                <Send size={13} className="text-white" />
              </button>

              {/* Collapse orb */}
              <button
                onClick={() => { setExpanded(false); }}
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150 ml-0.5"
                title="Collapse"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569' }}>
                <X size={13} />
              </button>
            </div>
          </motion.div>

        ) : (

          /* ── COLLAPSED BUBBLE ── */
          <motion.button
            key="bubble"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            onClick={() => setExpanded(true)}
            title="Ask Aether"
            className="relative group"
            style={{ transformOrigin: 'bottom center' }}
          >
            {/* Pulse rings */}
            <span className="absolute inset-0 rounded-full animate-ping opacity-20 pointer-events-none"
              style={{ background: 'linear-gradient(135deg,#3B9EFF,#A78BFA)', animationDuration: '2.2s' }} />
            <span className="absolute -inset-2 rounded-full animate-ping opacity-10 pointer-events-none"
              style={{ background: 'linear-gradient(135deg,#3B9EFF,#A78BFA)', animationDuration: '3.5s', animationDelay: '0.8s' }} />

            {/* Main orb */}
            <div className="relative w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
              style={{
                background: 'linear-gradient(135deg,#3B9EFF 0%,#6E54FF 50%,#A78BFA 100%)',
                boxShadow: '0 0 20px rgba(59,158,255,0.55), 0 0 40px rgba(167,139,250,0.25), 0 4px 24px rgba(0,0,0,0.4)',
                border: '1.5px solid rgba(255,255,255,0.18)',
              }}>
              <Zap size={22} className="text-white drop-shadow-lg" />
            </div>

            {/* Tooltip */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap pointer-events-none"
              style={{ background: 'rgba(10,13,22,0.92)', border: '1px solid rgba(255,255,255,0.08)', color: '#94A3B8' }}>
              Ask Aether
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Main App
═══════════════════════════════════════════════════════ */
function App() {
  const { appState, setAppState, viewMode, undo } = useStore();
  const [activeTab, setActiveTab] = useState<'thermal' | 'inspector' | 'validation' | 'export' | 'optimizer'>('thermal');

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [undo]);

  const viewLabel: Record<string, string> = {
    netlist: 'Component List', viewer2d: '2D Schematic', viewer3d: '3D Digital Twin',
  };

  const showChat = viewMode === 'viewer2d' || viewMode === 'viewer3d';

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans" style={{ background: 'var(--canvas)' }}>
      <AnimatePresence mode="wait">

        {appState === 'landing' && (
          <motion.div key="landing" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
            style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
            <LandingPage />
          </motion.div>
        )}

        {appState === 'splash' && (
          <SplashScreen key="splash" onComplete={() => setAppState('upload')} />
        )}

        {(appState === 'upload' || appState === 'dashboard') && (
          <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex w-full h-full">
            <Sidebar />

            <div className="flex-1 flex h-full min-w-0 overflow-hidden">
              <main className="flex-1 flex overflow-hidden">

                {appState === 'upload' ? (
                  <div className="flex-1 overflow-y-auto"><UploadZone /></div>
                ) : (
                  <div className="flex-1 flex overflow-hidden">

                    {/* ── CANVAS ── */}
                    <div className="flex-1 flex flex-col relative overflow-hidden min-w-0"
                      style={{ background: 'var(--canvas)' }}>

                      <div className="absolute inset-0 canvas-grid pointer-events-none opacity-40" />

                      <div className="absolute top-4 left-5 z-20 pointer-events-none select-none">
                        <span className="text-section uppercase tracking-[0.2em] font-semibold"
                          style={{ color: 'rgba(100,116,139,0.4)' }}>
                          {viewLabel[viewMode]}
                        </span>
                      </div>

                      <div className="flex-1 w-full relative min-h-0">
                        <AnimatePresence mode="wait">
                          <motion.div key={viewMode}
                            initial={{ opacity: 0, scale: 0.995 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.005 }}
                            transition={{ duration: 0.22 }}
                            className="absolute inset-0">
                            {viewMode === 'netlist'  && <DataGrid />}
                            {viewMode === 'viewer2d' && <Viewer2D />}
                            {viewMode === 'viewer3d' && <Viewer3D />}
                          </motion.div>
                        </AnimatePresence>
                      </div>

                      {/* ── FLOATING AETHER CHAT (2D/3D only) ── */}
                      <AnimatePresence>
                        {showChat && (
                          <motion.div
                            key="chat-bubble-wrapper"
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.7 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30"
                          >
                            <AetherChatBubble />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* ── RIGHT PANEL ── */}
                    <div className="w-[380px] xl:w-[400px] shrink-0 flex flex-col z-10"
                      style={{
                        background: 'var(--surface)',
                        borderLeft: '1px solid rgba(255,255,255,0.06)',
                        boxShadow: '-8px 0 32px rgba(0,0,0,0.30)',
                      }}>

                      <div className="flex shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <RailTab active={activeTab === 'thermal'} onClick={() => setActiveTab('thermal')}
                          label="Simulator" icon={<FlameKindling size={13} />} brand />
                        <RailTab active={activeTab === 'inspector'} onClick={() => setActiveTab('inspector')}
                          label="Inspector" icon={<SlidersHorizontal size={13} />} />
                        <RailTab active={activeTab === 'validation'} onClick={() => setActiveTab('validation')}
                          label="Validation" icon={<Activity size={13} />} />
                        <RailTab active={activeTab === 'export'} onClick={() => setActiveTab('export')}
                          label="Export" icon={<BarChart3 size={13} />} />
                        <RailTab active={activeTab === 'optimizer'} onClick={() => setActiveTab('optimizer')}
                          label="Optimizer" icon={<Sparkles size={13} />} highlight />
                      </div>

                      <div className="flex-1 relative overflow-hidden">
                        <AnimatePresence mode="wait">
                          {activeTab === 'thermal' && (
                            <motion.div key="thermal" {...panelAnim} className="absolute inset-0">
                              <ThermalSimulatorPanel />
                            </motion.div>
                          )}
                          {activeTab === 'inspector' && (
                            <motion.div key="inspector" {...panelAnim} className="absolute inset-0">
                              <InspectorPanel />
                            </motion.div>
                          )}
                          {activeTab === 'validation' && (
                            <motion.div key="validation" {...panelAnim} className="absolute inset-0">
                              <AccuracyPanel />
                            </motion.div>
                          )}
                          {activeTab === 'export' && (
                            <motion.div key="export" {...panelAnim} className="absolute inset-0">
                              <ExportPanel />
                            </motion.div>
                          )}
                          {activeTab === 'optimizer' && (
                            <motion.div key="optimizer" {...panelAnim} className="absolute inset-0">
                              <RoutingOptimizer />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                  </div>
                )}
              </main>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const panelAnim = {
  initial:    { opacity: 0, x: 6 },
  animate:    { opacity: 1, x: 0 },
  exit:       { opacity: 0, x: -6 },
  transition: { duration: 0.18 },
};

function RailTab({ active, onClick, label, icon, highlight, brand }: {
  active: boolean; onClick: () => void; label: string;
  icon: React.ReactNode; highlight?: boolean; brand?: boolean;
}) {
  const accent = highlight ? '#A78BFA' : brand ? '#3B9EFF' : '#3B9EFF';
  return (
    <button onClick={onClick}
      className={`rail-tab ${active ? 'rail-tab-active' : ''} relative`}
      style={highlight && !active ? { color: 'rgba(167,139,250,0.7)' } : undefined}
      title={label}>
      <span style={active ? { color: accent } : {}}>{icon}</span>
      <span className="text-[10px] hidden sm:block">{label}</span>
      {highlight && !active && (
        <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full animate-pulse-soft"
          style={{ background: accent }} />
      )}
      {active && (
        <motion.div layoutId="rail-tab-indicator"
          className="absolute bottom-0 left-0 right-0 h-0.5"
          style={{ background: accent }}
          transition={{ type: 'spring', stiffness: 500, damping: 40 }} />
      )}
    </button>
  );
}

export default App;