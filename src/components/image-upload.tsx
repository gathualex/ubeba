'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

type Preview = { file: File; sourceFile: File; url: string; cropped: boolean }
type CropTarget = { index: number; url: string }
type Point = { x: number; y: number }
type Size = { width: number; height: number }

const outputWidth = 1200
const outputHeight = 1500

function imageSize(natural: Size, frame: Size, zoom: number) {
  const scale = Math.max(frame.width / natural.width, frame.height / natural.height) * zoom
  return { width: natural.width * scale, height: natural.height * scale, scale }
}

function clampOffset(offset: Point, displayed: Size, frame: Size): Point {
  const maxX = Math.max(0, (displayed.width - frame.width) / 2)
  const maxY = Math.max(0, (displayed.height - frame.height) / 2)
  return { x: Math.min(maxX, Math.max(-maxX, offset.x)), y: Math.min(maxY, Math.max(-maxY, offset.y)) }
}

export function ImageUpload({ name = 'images', primaryName }: { name?: string; primaryName?: string }) {
  const [items, setItems] = useState<Preview[]>([])
  const [error, setError] = useState('')
  const [primaryIndex, setPrimaryIndex] = useState(0)
  const [crop, setCrop] = useState<CropTarget | null>(null)
  const [cropZoom, setCropZoom] = useState(1)
  const [cropOffset, setCropOffset] = useState<Point>({ x: 0, y: 0 })
  const [cropNaturalSize, setCropNaturalSize] = useState<Size | null>(null)
  const itemsRef = useRef<Preview[]>([])
  const cropUrlRef = useRef<string | null>(null)
  const cropFrameRef = useRef<HTMLDivElement>(null)
  const cropImageRef = useRef<HTMLImageElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragRef = useRef<{ pointerId: number; point: Point; offset: Point } | null>(null)

  useEffect(() => () => {
    itemsRef.current.forEach(item => URL.revokeObjectURL(item.url))
    if (cropUrlRef.current) URL.revokeObjectURL(cropUrlRef.current)
  }, [])

  function syncInputFiles(next: Preview[]) {
    if (!inputRef.current) return
    const transfer = new DataTransfer()
    next.forEach(item => transfer.items.add(item.file))
    inputRef.current.files = transfer.files
  }

  function closeCrop() {
    if (cropUrlRef.current) URL.revokeObjectURL(cropUrlRef.current)
    cropUrlRef.current = null
    dragRef.current = null
    setCrop(null)
    setCropNaturalSize(null)
    setCropZoom(1)
    setCropOffset({ x: 0, y: 0 })
  }

  function change(event: React.ChangeEvent<HTMLInputElement>) {
    const all = Array.from(event.target.files ?? [])
    const valid = all.filter(file => ['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type) && file.size <= 8 * 1024 * 1024)
    setError(valid.length === all.length ? '' : 'Some files were skipped. Use JPG, PNG, WebP or AVIF under 8 MB each.')
    if (cropUrlRef.current) URL.revokeObjectURL(cropUrlRef.current)
    cropUrlRef.current = null
    setCrop(null)
    itemsRef.current.forEach(item => URL.revokeObjectURL(item.url))
    const next = valid.map(file => ({ file, sourceFile: file, url: URL.createObjectURL(file), cropped: false }))
    itemsRef.current = next
    setItems(next)
    setPrimaryIndex(0)
    syncInputFiles(next)
  }

  function remove(file: File) {
    const next = items.filter(item => item.file !== file)
    const removedIndex = items.findIndex(item => item.file === file)
    const removed = items[removedIndex]
    if (removed) URL.revokeObjectURL(removed.url)
    itemsRef.current = next
    syncInputFiles(next)
    setItems(next)
    if (removedIndex === primaryIndex) setPrimaryIndex(0)
    else if (removedIndex < primaryIndex) setPrimaryIndex(primaryIndex - 1)
    if (crop?.index === removedIndex) closeCrop()
    else if (crop && crop.index > removedIndex) setCrop({ ...crop, index: crop.index - 1 })
  }

  function openCrop(index: number) {
    if (cropUrlRef.current) URL.revokeObjectURL(cropUrlRef.current)
    const url = URL.createObjectURL(items[index].sourceFile)
    cropUrlRef.current = url
    setCrop({ index, url })
    setCropZoom(1)
    setCropOffset({ x: 0, y: 0 })
    setCropNaturalSize(null)
  }

  function changeZoom(value: number) {
    setCropZoom(value)
    const frame = cropFrameRef.current
    if (!frame || !cropNaturalSize) return
    const frameSize = { width: frame.clientWidth, height: frame.clientHeight }
    const shown = imageSize(cropNaturalSize, frameSize, value)
    setCropOffset(offset => clampOffset(offset, shown, frameSize))
  }

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!cropNaturalSize || !cropFrameRef.current) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { pointerId: event.pointerId, point: { x: event.clientX, y: event.clientY }, offset: cropOffset }
  }

  function moveCrop(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    const frame = cropFrameRef.current
    if (!drag || drag.pointerId !== event.pointerId || !frame || !cropNaturalSize) return
    const frameSize = { width: frame.clientWidth, height: frame.clientHeight }
    const shown = imageSize(cropNaturalSize, frameSize, cropZoom)
    setCropOffset(clampOffset({
      x: drag.offset.x + event.clientX - drag.point.x,
      y: drag.offset.y + event.clientY - drag.point.y,
    }, shown, frameSize))
  }

  async function applyCrop() {
    if (!crop || !cropNaturalSize || !cropFrameRef.current || !cropImageRef.current) return
    const frame = cropFrameRef.current
    const frameSize = { width: frame.clientWidth, height: frame.clientHeight }
    const shown = imageSize(cropNaturalSize, frameSize, cropZoom)
    const sourceWidth = frameSize.width / shown.scale
    const sourceHeight = frameSize.height / shown.scale
    const sourceX = Math.min(cropNaturalSize.width - sourceWidth, Math.max(0, (cropNaturalSize.width - sourceWidth) / 2 - cropOffset.x / shown.scale))
    const sourceY = Math.min(cropNaturalSize.height - sourceHeight, Math.max(0, (cropNaturalSize.height - sourceHeight) / 2 - cropOffset.y / shown.scale))
    const canvas = document.createElement('canvas')
    canvas.width = outputWidth
    canvas.height = outputHeight
    const context = canvas.getContext('2d')
    if (!context) {
      setError('Could not prepare the cropped image. Please try another file.')
      return
    }
    const original = items[crop.index].sourceFile
    const requestedType = original.type === 'image/png' ? 'image/png' : original.type === 'image/webp' ? 'image/webp' : 'image/jpeg'
    if (requestedType === 'image/jpeg') {
      context.fillStyle = '#fff'
      context.fillRect(0, 0, outputWidth, outputHeight)
    }
    context.drawImage(cropImageRef.current, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, outputWidth, outputHeight)

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, requestedType, requestedType === 'image/jpeg' ? 0.92 : undefined))
    if (!blob || blob.size > 8 * 1024 * 1024) {
      setError('The cropped image is still over 8 MB. Choose a smaller file or crop a simpler area.')
      return
    }
    const extension = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg'
    const baseName = original.name.replace(/\.[^.]+$/, '')
    const croppedFile = new File([blob], `${baseName}-card.${extension}`, { type: blob.type, lastModified: Date.now() })
    const oldPreview = items[crop.index]
    const next = items.map((item, index) => index === crop.index
      ? { ...item, file: croppedFile, url: URL.createObjectURL(croppedFile), cropped: true }
      : item)
    URL.revokeObjectURL(oldPreview.url)
    itemsRef.current = next
    syncInputFiles(next)
    setItems(next)
    setError('')
    closeCrop()
  }

  const cropItem = crop ? items[crop.index] : null
  const cropDisplaySize = cropNaturalSize && cropFrameRef.current
    ? imageSize(cropNaturalSize, { width: cropFrameRef.current.clientWidth, height: cropFrameRef.current.clientHeight }, cropZoom)
    : null

  return <div className="image-upload">
    <input ref={inputRef} type="file" name={name} accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={change}/>
    {primaryName && <input type="hidden" name={primaryName} value={primaryIndex}/>}
    <p className="upload-help">Select multiple images together in the file picker. Hold Ctrl on Windows or Command on Mac while choosing files.</p>
    <p className="upload-help">Crop images to the 4:5 product-card frame before uploading. Drag to reposition and zoom for a closer crop.</p>
    {primaryName && <p className="upload-help">Choose the main image customers will see first on the product page and card.</p>}
    {error && <p className="error" role="status">{error}</p>}
    {items.length > 0 && <div className="upload-previews">{items.map((item, index) => <div className={index === primaryIndex && primaryName ? 'is-primary-image' : ''} key={`${item.file.name}-${item.file.lastModified}`}>
      <Image src={item.url} alt={`Preview: ${item.file.name}`} width={110} height={90} unoptimized/>
      <small>{item.file.name}</small>
      <button className="upload-crop-button" type="button" onClick={() => openCrop(index)}>{item.cropped ? 'Adjust crop' : 'Crop for card'}</button>
      {primaryName && <button className="upload-primary-button" type="button" aria-pressed={index === primaryIndex} onClick={() => setPrimaryIndex(index)}>{index === primaryIndex ? 'Main image' : 'Set as main image'}</button>}
      <button type="button" onClick={() => remove(item.file)}>Remove</button>
    </div>)}</div>}

    {crop && cropItem && <div className="image-crop-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) closeCrop() }}>
      <section className="image-crop-dialog" role="dialog" aria-modal="true" aria-labelledby="image-crop-title">
        <div className="image-crop-header"><div><span className="eyebrow">Card image</span><h2 id="image-crop-title">Crop for the product card</h2></div><button className="image-crop-close" type="button" onClick={closeCrop} aria-label="Close crop editor">×</button></div>
        <p className="image-crop-help">The highlighted 4:5 frame is what customers will see on product cards. Drag to reposition the image.</p>
        <div
          className="image-crop-frame"
          ref={cropFrameRef}
          onPointerDown={startDrag}
          onPointerMove={moveCrop}
          onPointerUp={() => { dragRef.current = null }}
          onPointerCancel={() => { dragRef.current = null }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={cropImageRef}
            src={crop.url}
            alt={`Crop preview for ${cropItem.file.name}`}
            draggable={false}
            onLoad={event => setCropNaturalSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
            style={cropDisplaySize ? {
              width: cropDisplaySize.width,
              height: cropDisplaySize.height,
              left: `calc(50% + ${cropOffset.x}px)`,
              top: `calc(50% + ${cropOffset.y}px)`,
            } : undefined}
          />
          <span className="image-crop-frame-mark" aria-hidden="true">4:5 CARD CROP</span>
        </div>
        <label className="image-crop-zoom">Zoom <input type="range" min="1" max="2.5" step="0.01" value={cropZoom} onChange={event => changeZoom(Number(event.target.value))}/><output>{cropZoom.toFixed(1)}×</output></label>
        <div className="image-crop-actions"><button className="button button-outline" type="button" onClick={closeCrop}>Cancel</button><button className="button button-dark" type="button" onClick={applyCrop} disabled={!cropNaturalSize}>Apply crop</button></div>
      </section>
    </div>}
  </div>
}
