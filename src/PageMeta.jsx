import { useEffect } from 'react'
import { getCurrentUser, getClubById } from './storage'
import { useSync } from './RealtimeProvider'

// 이미지를 캔버스로 64x64 압축 (파비콘용)
async function compressToFavicon(url) {
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const SIZE = 64
      const canvas = document.createElement('canvas')
      canvas.width = SIZE
      canvas.height = SIZE
      const ctx = canvas.getContext('2d')
      // 정사각형으로 센터 크롭
      const s = Math.min(img.width, img.height)
      const ox = (img.width - s) / 2
      const oy = (img.height - s) / 2
      ctx.drawImage(img, ox, oy, s, s, 0, 0, SIZE, SIZE)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

function setMeta(attr, key, value) {
  let el = document.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', value)
}

export default function PageMeta() {
  const sync = useSync()
  const user = getCurrentUser()
  const club = user?.clubId ? getClubById(user.clubId) : null

  const clubName = club?.name || ''
  const imageUrl = club?.imageUrl || ''
  const title = clubName ? `${clubName} · 북클럽` : '북클럽'

  useEffect(() => {
    // 탭 제목
    document.title = title

    // OG 태그 (JS로 업데이트 — 일부 메신저 앱에서 반영됨)
    setMeta('property', 'og:title',       title)
    setMeta('property', 'og:description', `${clubName || '북클럽'} · 함께 읽고, 나누고, 기록하는 독서 공간`)
    setMeta('name',     'twitter:title',  title)

    if (imageUrl) {
      setMeta('property', 'og:image',      imageUrl)
      setMeta('name',     'twitter:image', imageUrl)

      // 파비콘: 클럽 이미지를 64×64로 압축
      compressToFavicon(imageUrl).then(dataUrl => {
        if (!dataUrl) return
        let link = document.getElementById('club-favicon')
        if (!link) {
          link = document.createElement('link')
          link.id = 'club-favicon'
          link.rel = 'icon'
          link.type = 'image/png'
          document.head.appendChild(link)
          // 기본 파비콘 숨기기
          const def = document.getElementById('default-favicon')
          if (def) def.setAttribute('href', '')
        }
        link.href = dataUrl
      })
    } else {
      // 클럽 이미지 없으면 기본 이모지 파비콘 복원
      const club = document.getElementById('club-favicon')
      if (club) club.remove()
      const def = document.getElementById('default-favicon')
      if (def) def.setAttribute('href',
        "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📖</text></svg>"
      )
    }
  }, [title, imageUrl])

  return null
}
