import request from '@/utils/request.ts'

export interface UploadResult {
  fileId: string
  fileName: string
  url: string
  ossId: string
}

export function uploadFile(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<UploadResult>('/system/file/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function deleteFile(fileId: string) {
  return request.delete<void>(`/system/file/${fileId}`)
}
