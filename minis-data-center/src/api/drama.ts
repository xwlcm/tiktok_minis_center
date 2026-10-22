import request from '@/utils/request.ts'
import type { Drama, Episode, Tag, HomeSlot, HomeSlotCandidate, DramaCreateInfo, EpisodeCreateInfo, DramaCreateRequest, DramaCreateResponse, UnlockStatusVO, AdWatchResultVO } from '@/types/drama.ts'

export interface TagGroup {
  groupName: string
  tags: Tag[]
}

export function fetchDramaList(params?: {
  name?: string
  tagIds?: (number | string)[]
  status?: number
  pageNum?: number
  pageSize?: number
}) {
  // 手动构建 URLSearchParams，确保数组参数用 tagIds=1&tagIds=2 格式
  const searchParams = new URLSearchParams()
  if (params?.name) searchParams.append('name', params.name)
  if (params?.status != null) searchParams.append('status', String(params.status))
  if (params?.pageNum != null) searchParams.append('pageNum', String(params.pageNum))
  if (params?.pageSize != null) searchParams.append('pageSize', String(params.pageSize))
  if (params?.tagIds) {
    params.tagIds.forEach(id => searchParams.append('tagIds', String(id)))
  }
  return request.get<{ total: number; rows: Drama[] }>(`/drama/list?${searchParams.toString()}`)
}

export function fetchRecommendedDramas() {
  return request.get<Drama[]>('/drama/recommended')
}

export function fetchHotDramas() {
  return request.get<Drama[]>('/drama/hot')
}

export function fetchDramaDetail(id: number | string) {
  return request.get<Drama>(`/drama/${id}`)
}

export function createDrama(data: DramaCreateInfo) {
  return request.post<string>('/drama', data)
}

export function createFullDrama(data: DramaCreateRequest) {
  return request.post<DramaCreateResponse>('/drama/create-with-episodes-and-tags', data)
}

export function updateDrama(id: number | string, data: Partial<DramaCreateInfo>) {
  return request.put<void>('/drama', { ...data, id })
}

export function getDramaTags(dramaId: string) {
  return request.get<number[]>(`/drama/${dramaId}/tags`)
}

export function updateDramaTags(dramaId: string, tagIds: (number | string)[]) {
  return request.put<void>(`/drama/${dramaId}/tags`, tagIds)
}

export function addDramaTag(dramaId: string, tagId: number) {
  return request.post<void>(`/drama/${dramaId}/tags/${tagId}`)
}

export function removeDramaTag(dramaId: string, tagId: number) {
  return request.delete<void>(`/drama/${dramaId}/tags/${tagId}`)
}

export function deleteDrama(id: number | string, force = false) {
  return request.delete<void>(`/drama/${id}`, { params: { force } })
}

export function fetchEpisodeList(dramaId: number | string) {
  return request.get<Episode[]>(`/episode/list/${dramaId}`)
}

export function fetchEpisodeDetail(dramaId: number | string, episodeNumber: number) {
  return request.get<Episode>(`/episode/${dramaId}/${episodeNumber}`)
}

export function fetchFreeEpisodes(dramaId: number | string) {
  return request.get<Episode[]>(`/episode/free/${dramaId}`)
}

export function fetchEpisodeCount(dramaId: number | string) {
  return request.get<number>(`/episode/count/${dramaId}`)
}

export function createEpisode(data: EpisodeCreateInfo) {
  return request.post<number>('/episode', data)
}

export function appendEpisodes(data: {
  dramaId: string
  episodes: EpisodeCreateInfo[]
  storagePath?: string
}) {
  return request.post<number>('/episode/batch', data)
}

export function updateEpisode(id: number | string, data: Partial<EpisodeCreateInfo>) {
  return request.put<void>('/episode', { ...data, id })
}

export function deleteEpisode(id: number | string) {
  return request.delete<void>(`/episode/${id}`)
}

export function fetchTagList(params?: { groupName?: string; pageNum?: number; pageSize?: number }) {
  return request.get<{ total: number; rows: Tag[] }>('/drama/tag/list', { params })
}

export function fetchAllActiveTags() {
  return request.get<Tag[]>('/drama/tag/all')
}

export function fetchTagGrouped() {
  return request.get<TagGroup[]>('/drama/tag/grouped')
}

export function fetchTagDetail(id: number | string) {
  return request.get<Tag>(`/drama/tag/${id}`)
}

export function createTag(data: {
  name: string
  groupName: string
  color?: string | null
  icon?: string | null
  sortWeight: number
  status?: number
}) {
  return request.post<number>('/drama/tag', data)
}

export function updateTag(id: number | string, data: Partial<Tag>) {
  return request.put<void>('/drama/tag', { ...data, id })
}

export function deleteTag(id: number | string) {
  return request.delete<void>(`/drama/tag/${id}`)
}

export function fetchHomeSlots(slotType?: 'BANNER' | 'HOT' | 'RANK', tagId?: number) {
  const params: Record<string, string> = {}
  if (slotType) params.slotType = slotType
  if (tagId) params.tagId = String(tagId)
  return request.get<HomeSlot[]>('/drama/home/slots', { params })
}

export function fetchAllHomeSlots() {
  return request.get<HomeSlot[]>('/drama/home/slots/all')
}

export function fetchHomeSlotDetail(id: number) {
  return request.get<HomeSlot>(`/drama/home/slots/${id}`)
}

export function fetchHomeSlotCandidates(params: {
  slotType: 'BANNER' | 'HOT' | 'RANK'
  tagId?: number | null
  name?: string
  includeAdded?: boolean
  pageNum?: number
  pageSize?: number
}) {
  return request.get<{ total: number; rows: HomeSlotCandidate[] }>('/drama/home/slots/candidates', { params })
}

export function createHomeSlot(data: {
  slotType: 'BANNER' | 'HOT' | 'RANK'
  dramaId: string
  title?: string | null
  sort?: number
  enabled?: number
}) {
  return request.post<number>('/drama/home/slots', data)
}

export function updateHomeSlot(id: number, data: {
  slotType: 'BANNER' | 'HOT' | 'RANK'
  dramaId: string
  title?: string | null
  sort?: number
  enabled?: number
}) {
  return request.put<void>(`/drama/home/slots/${id}`, data)
}

export function toggleHomeSlotEnabled(id: number, enabled: number) {
  return request.put<void>(`/drama/home/slots/${id}/enabled`, { enabled })
}

export function moveHomeSlotSort(id: number, direction: 'UP' | 'DOWN') {
  return request.put<void>('/drama/home/slots/sort', { id, direction })
}

export function deleteHomeSlot(id: number) {
  return request.delete<void>(`/drama/home/slots/${id}`)
}

export function checkUnlockStatus(dramaId: string, episodeNumber: number, openId: string, clientKey: string) {
  return request.get<UnlockStatusVO>(`/drama/${dramaId}/episode/${episodeNumber}/unlock-status`, {
    params: { openId, clientKey },
  })
}

export function unlockByAd(dramaId: string, episodeNumber: number, data: {
  openId: string
  clientKey: string
  adUnitId: string
}) {
  return request.post<{ sessionId: string; adUnitId: string; adType: string; adUrl: string; timeout: number }>(
    `/drama/${dramaId}/episode/${episodeNumber}/unlock-by-ad`,
    data,
  )
}

export function reportAdWatch(dramaId: string, episodeNumber: number, data: {
  openId: string
  clientKey: string
  sessionId: string
  watchStatus: 'STARTED' | 'COMPLETED' | 'SKIPPED' | 'FAILED'
  watchDuration?: number
}) {
  return request.post<AdWatchResultVO>(
    `/drama/${dramaId}/episode/${episodeNumber}/ad-watched`,
    data,
  )
}

export function unlockByIap(dramaId: string, episodeNumber: number, data: {
  openId: string
  clientKey: string
  purchaseType: 'EPISODE' | 'BUNDLE'
  paymentMethod: string
}) {
  return request.post<{ orderId: string; paymentUrl: string }>(
    `/drama/${dramaId}/episode/${episodeNumber}/unlock-by-iap`,
    data,
  )
}
