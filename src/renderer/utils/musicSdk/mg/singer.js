import { createHttpFetch } from './utils'
import { filterMusicInfoListV5 } from './musicInfo'

// 咪咕 V5 PC 端接口（原 v3 页面与 MIGUM2.0 artist 路由均已失效，这些是当前站点在用的）
const BASE = 'https://app.u.nf.migu.cn'
const IMG_HOST = 'https://d.musicapp.migu.cn'

const getContents = (data) => data?.contents ?? []

export default {
  // 歌手歌曲接口每页固定 50 条，歌手专辑接口每页固定 10 条
  limit_song: 50,
  limit_album: 10,
  infoCache: new Map(),

  /**
   * 歌手基础信息：名称、头像、歌曲数、专辑数
   * @param {string} id 歌手 id
   * @returns {Promise<{name: string, img: string, songCount: number, albumCount: number, fanCount: string}>}
   */
  async getInfo(id) {
    if (this.infoCache.has(id)) return this.infoCache.get(id)

    const data = await createHttpFetch(`${BASE}/pc/bmw/singer/info/v1.1?singerId=${id}`)
    const contents = getContents(data)
    const scroll = contents.find(item => item.view == 'ZJ-SingerDetail-Scroll')?.contents?.[0] ?? {}
    const tabs = contents.find(item => item.view == 'ZJ-Tab-Scroll')?.contents ?? []
    const getTabCount = (action) => {
      const tab = tabs.find(item => item.action == action)
      return parseInt(tab?.txt2) || 0
    }

    const info = {
      name: scroll.txt ?? '',
      img: scroll.img2 ?? scroll.img ?? '',
      songCount: getTabCount('song'),
      albumCount: getTabCount('album'),
      fanCount: scroll.txt4 ?? '',
    }
    this.infoCache.set(id, info)
    return info
  },

  /**
   * 歌手歌曲列表（分页）
   * @param {string} id 歌手 id
   * @param {number} page 页码，从 1 开始
   */
  async getSongList(id, page = 1) {
    const data = await createHttpFetch(`${BASE}/pc/bmw/singer/song/v1.0?pageNo=${page}&singerId=${id}&type=1`)
    const contents = getContents(data)
    const rawList = contents.find(item => item.view == 'ZJ-Singer-Song-Scroll')?.contents ?? []
    return filterMusicInfoListV5(rawList.map(item => item.songItem).filter(Boolean)).map(item => {
      // img1~3 是相对路径，需要补上图片 host
      if (item.img && !/^https?:/.test(item.img)) item.img = IMG_HOST + item.img
      return item
    })
  },

  /**
   * 歌手专辑列表（接口每页 10 条，这里按需把多页拼起来）
   * @param {string} id 歌手 id
   * @param {number} page 起始页码
   * @param {number} limit 期望获取的条数
   */
  async getAlbumList(id, page = 1, limit = 100) {
    const info = await this.getInfo(id).catch(() => null)
    const total = info?.albumCount ?? 0
    const totalPage = total ? Math.ceil(total / this.limit_album) : 1
    const pageCount = Math.min(Math.max(Math.ceil(limit / this.limit_album), 1), totalPage)

    const tasks = []
    for (let i = 0; i < pageCount; i++) tasks.push(this.getAlbumPage(id, page + i))
    const list = await Promise.all(tasks)
    return { list: list.flat() }
  },

  async getAlbumPage(id, page) {
    const data = await createHttpFetch(`${BASE}/pc/bmw/singer/album/v1.0?pageNo=${page}&singerId=${id}`)
    return getContents(data).map(item => ({
      // resType=1 是数字专辑（咪咕不下发歌曲），单独标记，详情页只展示专辑信息
      id: `${item.resType == '1' ? 'dalbum__' : 'album__'}${item.resId}`,
      count: null,
      time: item.txt3 ?? '',
      info: {
        name: item.txt ?? '',
        img: item.img ?? '',
      },
    }))
  },

  /**
   * 歌手详情（详情页复用歌单详情页）
   * @param {string} id 歌手 id（不含 artist__ 前缀）
   * @param {number} page 页码
   */
  async getArtistDetail(id, page = 1) {
    const [info, list] = await Promise.all([
      this.getInfo(id).catch(() => null),
      this.getSongList(id, page).catch(() => []),
    ])

    return {
      list,
      page,
      limit: this.limit_song,
      total: info?.songCount ?? list.length,
      source: 'mg',
      info: {
        name: info?.name ?? '',
        img: info?.img ?? '',
        desc: '',
        author: info?.name ?? '',
        play_count: '',
      },
    }
  },
}
