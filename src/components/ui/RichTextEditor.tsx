import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Sincroniza o valor inicial e mudanças externas (mas evita pular o cursor)
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      // Só atualiza se o conteúdo real mudou para evitar que o cursor pule para o início
      if (editorRef.current.innerHTML !== value && value != null) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value]);

  const execCommand = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    editorRef.current?.focus();
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const ToolbarButton = ({ icon: Icon, command, arg, title }: { icon: any, command: string, arg?: string, title: string }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault(); // Impede a perda de foco do contentEditable
        execCommand(command, arg);
      }}
      className="p-1.5 sm:p-2 rounded-lg text-gray-500 hover:text-vanta-blue hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
    >
      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
    </button>
  );

  return (
    <div className="w-full border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 overflow-hidden focus-within:border-vanta-blue focus-within:ring-2 focus-within:ring-vanta-blue/20 transition-all">
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 dark:border-gray-700 p-2 bg-gray-50 dark:bg-gray-800/80">
        <ToolbarButton icon={Bold} command="bold" title="Negrito" />
        <ToolbarButton icon={Italic} command="italic" title="Itálico" />
        <ToolbarButton icon={Underline} command="underline" title="Sublinhado" />
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
        
        <ToolbarButton icon={AlignLeft} command="justifyLeft" title="Alinhar à Esquerda" />
        <ToolbarButton icon={AlignCenter} command="justifyCenter" title="Centralizar" />
        <ToolbarButton icon={AlignRight} command="justifyRight" title="Alinhar à Direita" />
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
        
        <ToolbarButton icon={List} command="insertUnorderedList" title="Lista com Marcadores" />
        <ToolbarButton icon={ListOrdered} command="insertOrderedList" title="Lista Numerada" />
      </div>
      
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        className="w-full min-h-[150px] max-h-[400px] overflow-y-auto p-4 outline-none text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_b]:font-black [&_i]:italic [&_u]:underline"
        placeholder={placeholder}
      />
    </div>
  );
}
