import { useRef, useState } from 'react'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase'

export default function ImageUpload({ value, onChange, label = '이미지 업로드', aspect = 'landscape' }) {
  const inputRef = useRef()
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState('')

  const previewClass = aspect === 'portrait'
    ? 'w-full aspect-[2/3] max-w-[140px]'
    : 'w-full h-36'

  function handleFile(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능해요')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('5MB 이하 파일만 업로드 가능해요')
      return
    }

    setError('')
    const ext = file.name.split('.').pop().toLowerCase()
    const path = `images/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const storageRef = ref(storage, path)
    const task = uploadBytesResumable(storageRef, file)

    task.on('state_changed',
      snap => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      err => { setError('업로드 실패: ' + err.message); setProgress(null) },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        onChange(url)
        setProgress(null)
      }
    )
  }

  const uploading = progress !== null

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {/* 미리보기 */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={`${previewClass} rounded-xl overflow-hidden bg-gray-100 cursor-pointer relative flex items-center justify-center`}
      >
        {value ? (
          <img src={value} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1.5 text-gray-400 py-6">
            <span className="text-3xl">📷</span>
            <span className="text-xs">{label}</span>
          </div>
        )}

        {/* 업로드 중 오버레이 */}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
            <div className="w-3/4 h-1.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-white text-xs font-medium">{progress}%</span>
          </div>
        )}
      </div>

      {/* 버튼 */}
      <button
        type="button"
        onClick={() => !uploading && inputRef.current?.click()}
        disabled={uploading}
        className="mt-2 w-full py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium disabled:opacity-50 active:bg-gray-50"
      >
        {uploading ? `업로드 중… ${progress}%` : value ? '이미지 변경' : label}
      </button>

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}
