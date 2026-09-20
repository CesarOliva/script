import { useEffect, useMemo, useRef, useState } from 'react';
import { compileSource } from './Analyzer/compiler';
import { CompilerStepEngine } from './Analyzer/compilerStepEngine';
import { codeExamples, codeExamplesLabels } from './Analyzer/examples';
import CodeEditor from './components/CodeEditor';
import StepDebugger, { phaseLabel } from './components/StepDebugger';
import Tabs, { type TabId } from './components/Tabs';
import { badgeClass, type BadgeVariant, buttonClass } from './components/styles';

const AUTOPLAY_MS = 1200;

export default function App() {
  const [source, setSource] = useState<string>(codeExamples.valido);
  const [tab, setTab] = useState<TabId>('tokens');
  const [stepMode, setStepMode] = useState(false);
  const [stepLine, setStepLine] = useState<number | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const stepTimer = useRef<number | null>(null);

  const result = useMemo(() => compileSource(source), [source]);

  // Motor paso a paso (100% client-side, se reconstruye al cambiar el fuente).
  const stepEngine = useMemo(() => new CompilerStepEngine(source), [source]);
  const stepSteps = useMemo(() => stepEngine.getSteps(), [stepEngine]);
  const stepSnap = stepSteps[Math.min(stepIndex, stepSteps.length - 1)];
  const stepProgress = stepSteps.length > 1 ? Math.round((stepIndex / (stepSteps.length - 1)) * 100) : 100;

  // Reiniciar cursor al cambiar el código.
  useEffect(() => {
    setStepIndex(0);
    setPlaying(false);
  }, [source]);

  // Auto-play estilo Jupyter: avanza hasta el final y se detiene.
  useEffect(() => {
    if (!playing || !stepMode) return;
    if (stepIndex >= stepSteps.length - 1) {
      setPlaying(false);
      return;
    }
    stepTimer.current = window.setTimeout(
      () => setStepIndex((i) => Math.min(i + 1, stepSteps.length - 1)),
      AUTOPLAY_MS,
    );
    return () => {
      if (stepTimer.current !== null) window.clearTimeout(stepTimer.current);
    };
  }, [playing, stepIndex, stepSteps.length, stepMode]);

  // Sincroniza la línea activa con el editor.
  useEffect(() => {
    if (stepMode && stepSnap) setStepLine(stepSnap.currentCodeLine);
  }, [stepMode, stepSnap]);

  const goPrev = () => { setPlaying(false); setStepIndex((i) => Math.max(0, i - 1)); };
  const goNext = () => { setPlaying(false); setStepIndex((i) => Math.min(stepSteps.length - 1, i + 1)); };
  const goReset = () => { setPlaying(false); setStepIndex(0); };
  const togglePlay = () => {
    if (stepIndex >= stepSteps.length - 1 && !playing) setStepIndex(0);
    setPlaying((p) => !p);
  };

  const status: { label: string; variant: BadgeVariant } = !source.trim()
    ? { label: 'Sin código', variant: 'neutral' }
    : result.lexicalErrors.length > 0
      ? { label: `❌ ${result.lexicalErrors.length} error(es) léxico(s)`, variant: 'error' }
      : result.syntaxError
        ? { label: '❌ Error sintáctico', variant: 'error' }
        : result.semanticErrors.length > 0
          ? { label: `❌ ${result.semanticErrors.length} error(es) semántico(s)`, variant: 'error' }
          : result.ok
            ? { label: '✅ Compilación correcta', variant: 'ok' }
            : { label: 'Sin resultado', variant: 'neutral' };

  return (
    <div className="mx-auto w-full py-4 px-6 flex flex-col gap-4 min-h-screen md:h-screen md:min-h-0 md:max-h-screen md:overflow-hidden">
      <header className="flex flex-wrap justify-between items-center gap-3 shrink-0">
        <div className='flex items-center gap-4'>
          <h1 className="text-[2rem] font-bold">PyScript</h1>
          <div className="w-px h-8 bg-[#aeb9ca] "></div>
          <h3 className='text-md text-[#aeb9ca]'>Playground</h3>
        </div>
        <span className={badgeClass(status.variant)}>{status.label}</span>
      </header>

      <div className="flex flex-wrap gap-2 items-center bg-white/2 border border-[#2b3850] rounded-lg py-2 px-4 shrink-0">
        <span className="text-[#aeb9ca] mr-4">Ejemplos:</span>

        {Object.keys(codeExamples).map((key) => (
          <button
            key={key}
            className={buttonClass(source === codeExamples[key])}
            onClick={() => setSource(codeExamples[key])}
          >
            {codeExamplesLabels[key]}
          </button>
        ))}
        <button
          className={`${buttonClass(stepMode)} ml-auto`}
          onClick={() => {
            setStepMode((v) => !v);
            if (stepMode) setStepLine(null);
          }}
          title="Ejecuta el código instrucción por instrucción (Lexer → Parser → Semántico)"
        >
          {stepMode ? '🔬 Salir del modo paso a paso' : '🔬 Modo paso a paso'}
        </button>
      </div>

      <main className="flex flex-col gap-4 md:flex-1 md:min-h-0 md:overflow-hidden md:grid md:grid-cols-12">
        <section className="md:col-span-7 min-h-115 md:min-h-0 md:flex-1 md:overflow-hidden flex flex-col gap-2 md:h-full">
          {stepMode && stepSnap && (
            <div className="shrink-0 border border-amber-400/30 rounded-lg bg-white/2 px-3 py-2 flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-amber-200">🔬 Paso a paso</span>
                <button className={buttonClass(false)} onClick={goPrev} disabled={stepIndex === 0}>◀ Anterior</button>
                <button className={buttonClass(false)} onClick={goNext} disabled={stepIndex >= stepSteps.length - 1}>Siguiente ▶</button>
                <button className={buttonClass(playing)} onClick={togglePlay}>{playing ? '⏸ Pausar' : '▶ Play'}</button>
                <button className={buttonClass(false)} onClick={goReset}>🔄</button>
                <span className="ml-auto font-mono text-xs text-[#aeb9ca]">
                  Paso {stepSnap.stepIndex + 1} / {stepSnap.totalSteps} · Línea {stepSnap.currentCodeLine}
                </span>
                <span className={badgeClass(stepSnap.phase === 'error' ? 'error' : stepSnap.phase === 'fin' ? 'ok' : 'neutral')}>
                  {phaseLabel[stepSnap.phase] ?? stepSnap.phase}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[#1a2230] overflow-hidden">
                <div className="h-full bg-amber-400 transition-all" style={{ width: `${stepProgress}%` }} />
              </div>
            </div>
          )}
          <CodeEditor
            value={source}
            onChange={setSource}
            highlightedLine={stepMode ? stepLine : null}
            placeholder={'program Main {\n  print("Hola");\n}'}
            fileName={
              source === codeExamples.valido ? 'valido.pys' : 
              source === codeExamples.errores ? 'errores.pys' : 
              source === codeExamples.scope ? 'scope.pys' : 
              source === codeExamples.arrays ? 'arrays.pys' : 
              source === codeExamples.stack ? 'stack.pys' : 
              'main.pys'}
          />
        </section>

        {stepMode ? (
          <StepDebugger steps={stepSteps} index={stepIndex} />
        ) : (
          <Tabs activeTab={tab} onTabChange={setTab} result={result} />
        )}
      </main>
    </div>
  );
}
