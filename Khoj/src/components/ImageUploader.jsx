import { useEffect, useRef, useState } from 'react'
import { ImagePlus, UploadCloud, X } from 'lucide-react'

const maxSize = 5 * 1024 * 1024
const maxFiles = 1
const supportedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const supportedImageExtensions = /\.(jpe?g|png|webp)$/i

export default function ImageUploader({ files, onChange }) {
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const filesRef = useRef(files)
  useEffect(() => { filesRef.current = files }, [files])
  useEffect(() => () => filesRef.current.forEach((item) => URL.revokeObjectURL(item.preview)), [])

  function addFiles(fileList) {
    const incoming = Array.from(fileList || [])
    const valid = []
    const issues = []
    for (const file of incoming) {
      if (!supportedImageTypes.has(file.type) && !supportedImageExtensions.test(file.name)) {
        issues.push('Choose a JPG, PNG, or WEBP image.')
        continue
      }
      if (file.size > maxSize) {
        issues.push(`${file.name} is larger than 5 MB.`)
        continue
      }
      if (files.length + valid.length >= maxFiles) {
        issues.push('The image model accepts one photo. Remove the current photo to choose another.')
        break
      }
      valid.push({ file, preview: URL.createObjectURL(file), id: `${file.name}-${file.lastModified}-${Math.random()}` })
    }
    if (valid.length) onChange([...files, ...valid])
    setError(issues.join(' '))
  }

  function removeFile(id) {
    const removed = files.find((item) => item.id === id)
    if (removed) URL.revokeObjectURL(removed.preview)
    onChange(files.filter((item) => item.id !== id))
  }

  return <div>
    <label className={`upload-box ${dragging ? 'upload-dragging' : ''}`} onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files) }}>
      <input className="visually-hidden" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" aria-label="Upload a skin photo" onChange={(event) => { addFiles(event.target.files); event.target.value = '' }} />
      <span className="upload-icon"><UploadCloud size={21} /></span>
      <strong>Drop your photo here, or <span className="link-button">browse</span></strong>
      <small>JPG, PNG or WEBP · 1 image, max 5 MB</small>
    </label>
    {error && <p className="field-error upload-error" role="alert">{error}</p>}
    {files.length > 0 && <div className="preview-grid">{files.map((item, index) => <div className="image-preview" key={item.id}><img src={item.preview} alt={`Uploaded skin photo ${index + 1}`} /><span><ImagePlus size={12} /> Photo {index + 1}</span><button type="button" aria-label={`Remove photo ${index + 1}`} onClick={() => removeFile(item.id)}><X size={15} /></button></div>)}</div>}
  </div>
}
