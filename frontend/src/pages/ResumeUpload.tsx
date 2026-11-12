import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload,
  FileText,
  AlertCircle,
  X,
  ArrowRight,
  Shield,
  Loader2
} from 'lucide-react'

export default function ResumeUpload() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadStage, setUploadStage] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const token = localStorage.getItem('token')

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const validateAndSetFile = (selectedFile: File) => {
    setError(null)
    const validExtensions = ['.pdf', '.docx', '.doc']
    const name = selectedFile.name.toLowerCase()
    const isValidExt = validExtensions.some((ext) => name.endsWith(ext))

    if (!isValidExt) {
      setError('Unsupported file type. Please upload a PDF or DOCX document.')
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File exceeds 10MB limit. Please upload an optimized document.')
      return
    }

    setFile(selectedFile)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a resume file to audit.')
      return
    }

    setError(null)
    setUploading(true)
    setUploadStage('Uploading document to local parser...')

    const formData = new FormData()
    formData.append('file', file)

    const stageTimer1 = setTimeout(() => {
      setUploadStage('Extracting document sections, employment history & contact info...')
    }, 1500)

    const stageTimer2 = setTimeout(() => {
      setUploadStage('Auditing ATS impact metrics, action verbs & grammar...')
    }, 3200)

    const stageTimer3 = setTimeout(() => {
      setUploadStage('Compiling section scores & generating bullet rewrites...')
    }, 5500)

    try {
      const res = await fetch('/api/resumes/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      })

      clearTimeout(stageTimer1)
      clearTimeout(stageTimer2)
      clearTimeout(stageTimer3)

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || 'Resume upload and analysis failed.')
      }

      const resumeId = data.resume_id || data.id
      if (resumeId) {
        navigate(`/analysis/${resumeId}`)
      } else {
        throw new Error('Analysis completed but resume identifier is missing.')
      }
    } catch (err: any) {
      clearTimeout(stageTimer1)
      clearTimeout(stageTimer2)
      clearTimeout(stageTimer3)
      setError(err.message || 'An error occurred during resume audit processing.')
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="text-xs font-mono uppercase text-zinc-400">
          Intake / ATS Document Diagnostic
        </div>
        <h1 className="text-2xl font-semibold text-white">
          Upload Resume for Diagnostic Audit
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Submit your PDF or DOCX file to evaluate formatting hygiene, quantified impact density, and section parseability.
        </p>
      </div>

      {/* Error Callout */}
      {error && (
        <div className="p-3.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-rose-200">Processing Interrupted</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* Upload Panel */}
      <div className="surface-panel p-6 sm:p-8 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc"
            onChange={handleFileChange}
            className="hidden"
          />

          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed rounded-lg p-10 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? 'border-zinc-400 bg-[#16181E]'
                  : 'border-[#262830] hover:border-zinc-500 hover:bg-[#101216]'
              }`}
            >
              <div className="w-10 h-10 rounded bg-[#181A1F] border border-[#272A31] flex items-center justify-center text-zinc-400">
                <Upload className="w-5 h-5" />
              </div>

              <div className="space-y-1">
                <div className="text-xs sm:text-sm font-medium text-white">
                  Click to select file or drag document here
                </div>
                <p className="text-xs text-zinc-400">
                  Supported formats: PDF, DOCX (Maximum file size 10MB)
                </p>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-zinc-400 pt-1">
                <Shield className="w-3.5 h-3.5 text-zinc-400" />
                <span>Encrypted in memory • Isolated candidate storage</span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-[#0E0F12] border border-[#202227] space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[#181A1F] border border-[#272A31] flex items-center justify-center text-zinc-400 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium text-white text-xs truncate max-w-sm">
                      {file.name}
                    </div>
                    <div className="text-[11px] text-zinc-400 tabular-data">
                      {formatFileSize(file.size)} • Ready for processing
                    </div>
                  </div>
                </div>

                {!uploading && (
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-[#181A1F] transition"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {uploading && (
                <div className="p-3 rounded bg-[#121316] border border-[#202227] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-medium flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                      <span>{uploadStage}</span>
                    </span>
                    <span className="text-zinc-400 font-mono text-[11px]">Processing</span>
                  </div>
                  <div className="w-full h-1 bg-[#1C1E24] rounded-full overflow-hidden">
                    <div className="h-full bg-zinc-400 rounded-full animate-pulse w-3/4" />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="text-[11px] text-zinc-400">
              Evaluates impact metrics, section parseability, and grammar.
            </div>

            <button
              type="submit"
              disabled={!file || uploading}
              className="px-5 py-2 rounded-md font-semibold text-xs text-zinc-950 bg-white hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1.5"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-950" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Begin Diagnostic</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Parsing Criteria Specifications */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3.5 rounded-lg bg-[#0E0F12] border border-[#202227] space-y-1">
          <div className="font-medium text-white">Section Parseability</div>
          <p className="text-zinc-400 text-[11px]">
            Verifies Contact, Summary, Experience, and Skills header detection.
          </p>
        </div>
        <div className="p-3.5 rounded-lg bg-[#0E0F12] border border-[#202227] space-y-1">
          <div className="font-medium text-white">Quantifiable Metric Density</div>
          <p className="text-zinc-400 text-[11px]">
            Flags unquantified passive assertions and delivers metric-backed rewrites.
          </p>
        </div>
        <div className="p-3.5 rounded-lg bg-[#0E0F12] border border-[#202227] space-y-1">
          <div className="font-medium text-white">Mentorship Context Sync</div>
          <p className="text-zinc-400 text-[11px]">
            Results sync into your AI Career Mentor studio for interview preparation.
          </p>
        </div>
      </div>
    </div>
  )
}
