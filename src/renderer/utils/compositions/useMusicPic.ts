import { ref } from '@common/utils/vueTools'
import { getPicPath } from '@renderer/core/music'

/**
 * 歌曲封面获取（列表用）
 *
 * 说明：列表数据里的 `musicInfo.meta.picUrl` 在多数音源（kw / kg / bd）下是空的，
 * 只有 wy / tx 的搜索结果会自带封面地址，所以不能直接 `v-if="item.meta.picUrl"`，
 * 必须走 `getPicPath()` 按需异步获取。
 *
 * 这里做了三件事：
 * 1. 全局结果缓存（成功/失败都缓存），同一首歌不会重复请求
 * 2. 请求合并，同一首歌并发多次调用只会发出一个请求
 * 3. 并发上限，避免快速滚动列表时瞬间发出大量请求
 */

// 同时发起的封面请求数量上限
const MAX_CONCURRENT = 3

// 封面缓存：musicId -> 图片地址，失败时缓存空字符串，避免反复重试
const picCache = new Map<string, string>()

// 正在进行的请求：musicId -> Promise，用于合并重复请求
const taskCache = new Map<string, Promise<string>>()

const queue: Array<() => Promise<void>> = []
let activeNum = 0

const runNext = () => {
  while (activeNum < MAX_CONCURRENT && queue.length) {
    const task = queue.shift()
    if (!task) break
    activeNum++
    void Promise.resolve().then(task).finally(() => {
      activeNum--
      runNext()
    })
  }
}

const requestPic = (musicInfo: LX.Music.MusicInfo, listId?: string | null): Promise<string> => {
  const id = musicInfo.id
  const existTask = taskCache.get(id)
  if (existTask) return existTask

  const task = new Promise<string>((resolve) => {
    queue.push(async() => {
      let url = ''
      try {
        url = (await getPicPath({ musicInfo, listId })) || ''
      } catch (err) {
        url = ''
      }
      picCache.set(id, url)
      resolve(url)
    })
  }).finally(() => {
    taskCache.delete(id)
  })
  taskCache.set(id, task)
  runNext()
  return task
}

export default ({ getListId }: { getListId?: () => string | null } = {}) => {
  // 响应式封面表：musicId -> 图片地址
  // 只在当前实例内维护，封面加载完成时只触发对应那一行的更新
  const picUrls = ref<Record<string, string>>({})

  /**
   * 获取歌曲封面地址
   * 首次调用时地址通常还没拿到，会返回空字符串并开始异步请求，
   * 请求完成后 picUrls 变更会自动触发重新渲染，届时即可拿到地址。
   */
  const getPicUrl = (musicInfo?: LX.Music.MusicInfo | null): string => {
    const id = musicInfo?.id
    if (!musicInfo || !id) return ''
    const url = picUrls.value[id]
    if (url) return url
    const cached = picCache.get(id)
    if (cached != null) return cached
    void requestPic(musicInfo, getListId ? getListId() : null).then(picUrl => {
      picUrls.value[id] = picUrl
    })
    return ''
  }

  return {
    getPicUrl,
  }
}
