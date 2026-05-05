"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, AlertCircle, FileText, CheckCircle2 } from "lucide-react"

interface FileUploadProps {
  onFileUpload: (file: File) => void
  acceptedFileTypes: string
  maxSizeMB?: number
}

export function FileUpload({ onFileUpload, acceptedFileTypes, maxSizeMB = 5 }: FileUploadProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setError(null)
    setSuccess(null)

    if (!file) {
      return
    }

    // Check file type
    const fileType = file.name.split(".").pop()?.toLowerCase()
    const isAcceptedType = acceptedFileTypes.includes(fileType || "")

    if (!isAcceptedType) {
      setError(`Invalid file type. Please upload ${acceptedFileTypes.replace(/,/g, " or ")} files.`)
      return
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxSizeMB) {
      setError(`File size exceeds ${maxSizeMB}MB limit.`)
      return
    }

    setFileName(file.name)
    setSuccess(`File "${file.name}" ready for upload.`)
    onFileUpload(file)
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <div
        className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={triggerFileInput}
      >
        <Upload className="h-10 w-10 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>
        <p className="text-xs text-gray-500">
          {acceptedFileTypes.replace(/,/g, ", ")} (Max {maxSizeMB}MB)
        </p>
        <Input
          ref={fileInputRef}
          type="file"
          accept={acceptedFileTypes}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {fileName && (
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
          <FileText className="h-5 w-5 text-gray-500" />
          <span className="text-sm text-gray-700 truncate flex-1">{fileName}</span>
          {success && <CheckCircle2 className="h-5 w-5 text-green-500" />}
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
