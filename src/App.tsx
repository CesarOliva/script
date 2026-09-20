import { useMemo, useState } from 'react';
import { compileSource } from './Analyzer/compiler';
import { codeExamples, codeExamplesLabels } from './Analyzer/examples';
import CodeEditor from './components/CodeEditor';
import Tabs, { type TabId } from './components/Tabs';
import { badgeClass, type BadgeVariant, buttonClass } from './components/styles';

export default function App() {
  const [source, setSource] = useState<string>(codeExamples.valido);
  const [tab, setTab] = useState<TabId>('tokens');

  const result = useMemo(() => compileSource(source), [source]);

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
      </div>

      <main className="flex flex-col gap-4 md:flex-1 md:min-h-0 md:overflow-hidden md:grid md:grid-cols-12">
        <section className="md:col-span-7 min-h-115 md:min-h-0 md:flex-1 md:overflow-hidden flex flex-col md:h-full">
          <CodeEditor
            value={source}
            onChange={setSource}
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

        <Tabs activeTab={tab} onTabChange={setTab} result={result} />
      </main>
    </div>
  );
}
