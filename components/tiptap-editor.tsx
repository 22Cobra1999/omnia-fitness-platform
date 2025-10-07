"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Placeholder from "@tiptap/extension-placeholder"
import { useCallback, useEffect, useState } from "react"
import { Bold, Italic, UnderlineIcon, AlignLeft, AlignCenter, AlignRight, List, ListOrdered } from "lucide-react"
import { Button } from "@/components/ui/button"

type TiptapEditorProps = {
  content: string
  onChange: (content: string) => void
  className?: string
  placeholder?: string
}

export const TiptapEditor = ({
  content,
  onChange,
  className = "",
  placeholder = "Escribe una descripción detallada aquí...",
}: TiptapEditorProps) => {
  const [isFocused, setIsFocused] = useState(false)
  const [wordCount, setWordCount] = useState(0)

  // Función para contar palabras en un texto HTML
  const countWords = useCallback((html: string) => {
    // Eliminar etiquetas HTML
    const text = html.replace(/<[^>]*>/g, " ")
    // Eliminar espacios múltiples
    const cleanText = text.replace(/\s+/g, " ").trim()
    // Contar palabras
    return cleanText ? cleanText.split(" ").length : 0
  }, [])

  // Inicializar el editor con extensiones simplificadas
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Desactivar encabezados
      }),
      Underline,
      TextAlign.configure({
        types: ["paragraph"],
        alignments: ["left", "center", "right"],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    immediatelyRender: false, // Arreglar error de hidratación
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)
      setWordCount(countWords(html))
    },
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none p-4 focus:outline-none min-h-[200px] text-white prose-invert",
      },
      // Prevenir que el Enter envíe el formulario
      handleKeyDown: (view, event) => {
        if (event.key === "Enter" && !event.shiftKey && (event.target as HTMLElement)?.closest("form")) {
          // Prevenir que el evento se propague al formulario
          event.stopPropagation()
          return false
        }
        return false
      },
    },
  })

  // Actualizar el contador de palabras al cargar el contenido inicial
  useEffect(() => {
    if (content) {
      setWordCount(countWords(content))
    }
  }, [content, countWords])

  // Actualizar el contenido del editor cuando cambia el prop content
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  // Si el editor no está listo, mostrar un espacio reservado
  if (!editor) {
    return (
      <div className={`border rounded-md ${className} bg-gray-900 h-64 flex items-center justify-center`}>
        <span className="text-gray-500">Cargando editor...</span>
      </div>
    )
  }

  // Funciones de formato simplificadas y corregidas
  const toggleBold = () => editor.chain().focus().toggleBold().run()
  const toggleItalic = () => editor.chain().focus().toggleItalic().run()
  const toggleUnderline = () => editor.chain().focus().toggleUnderline().run()
  const toggleBulletList = () => editor.chain().focus().toggleBulletList().run()
  const toggleOrderedList = () => editor.chain().focus().toggleOrderedList().run()
  const setTextAlignLeft = () => editor.chain().focus().setTextAlign("left").run()
  const setTextAlignCenter = () => editor.chain().focus().setTextAlign("center").run()
  const setTextAlignRight = () => editor.chain().focus().setTextAlign("right").run()

  return (
    <div
      className={`border rounded-md overflow-hidden ${className} ${
        isFocused ? "ring-2 ring-orange-500 ring-opacity-50" : ""
      }`}
    >
      {/* Barra de herramientas simplificada */}
      <div className="flex flex-wrap items-center gap-1 p-1 border-b bg-gray-800">
        {/* Formato de texto */}
        <div className="flex items-center gap-1 mr-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleBold}
            className={`p-1 h-8 w-8 ${editor.isActive("bold") ? "bg-orange-600 text-white" : "text-white hover:bg-gray-700"}`}
            aria-label="Negrita"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleItalic}
            className={`p-1 h-8 w-8 ${editor.isActive("italic") ? "bg-orange-600 text-white" : "text-white hover:bg-gray-700"}`}
            aria-label="Cursiva"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleUnderline}
            className={`p-1 h-8 w-8 ${editor.isActive("underline") ? "bg-orange-600 text-white" : "text-white hover:bg-gray-700"}`}
            aria-label="Subrayado"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Separador */}
        <div className="h-6 mx-1 w-px bg-gray-600" />

        {/* Listas */}
        <div className="flex items-center gap-1 mr-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleBulletList}
            className={`p-1 h-8 w-8 ${editor.isActive("bulletList") ? "bg-orange-600 text-white" : "text-white hover:bg-gray-700"}`}
            aria-label="Lista con viñetas"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleOrderedList}
            className={`p-1 h-8 w-8 ${editor.isActive("orderedList") ? "bg-orange-600 text-white" : "text-white hover:bg-gray-700"}`}
            aria-label="Lista numerada"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        {/* Separador */}
        <div className="h-6 mx-1 w-px bg-gray-600" />

        {/* Alineación */}
        <div className="flex items-center gap-1 mr-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={setTextAlignLeft}
            className={`p-1 h-8 w-8 ${editor.isActive({ textAlign: "left" }) ? "bg-orange-600 text-white" : "text-white hover:bg-gray-700"}`}
            aria-label="Alinear a la izquierda"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={setTextAlignCenter}
            className={`p-1 h-8 w-8 ${editor.isActive({ textAlign: "center" }) ? "bg-orange-600 text-white" : "text-white hover:bg-gray-700"}`}
            aria-label="Centrar"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={setTextAlignRight}
            className={`p-1 h-8 w-8 ${editor.isActive({ textAlign: "right" }) ? "bg-orange-600 text-white" : "text-white hover:bg-gray-700"}`}
            aria-label="Alinear a la derecha"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Contenido del editor */}
      <div className="bg-gray-900 text-white">
        <EditorContent editor={editor} className="prose-invert" />
      </div>

      {/* Barra de estado */}
      <div className="flex justify-between items-center px-3 py-1 text-xs text-gray-400 bg-gray-800 border-t border-gray-700">
        <div>{wordCount} palabras</div>
        <div>{isFocused ? "Editando" : "Haz clic para editar"}</div>
      </div>
    </div>
  )
}
