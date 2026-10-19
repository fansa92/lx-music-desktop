import { createHttpFetch } from './utils'
import { filterMusicInfoListV5 } from './musicInfo'
import { formatPlayCount } from '../../index'

export default {
  /**
   * 通过AlbumId获取专辑
   * @param {*} id
   * @param {*} page
   */
  async getAlbumDetail(id, page = 1) {
    // 旧端点 queryAlbumSong（MIGUM2.0/app.c.nf）已失效（返回空 data），改用 MIGUM3.0 resource/album/song
    const data = await createHttpFetch(`https://app.c.nf.migu.cn/MIGUM3.0/resource/album/song/v2.0?albumId=${id}&pageNo=${page}&pageSize=200`)
    const rawList = (data && data.songList) || []
    // V5 结构（audioFormats/singerList/duration），img1~3 为相对路径需补 host
    const songList = filterMusicInfoListV5(rawList).map(item => {
      if (item.img && !/^https?:/.test(item.img)) item.img = 'https://d.musicapp.migu.cn' + item.img
      return item
    })
    const listInfo = await this.getAlbumInfo(id).catch(() => ({}))

    const total = listInfo.total || (data && data.totalCount) || songList.length
    return {
      list: songList,
      page,
      limit: total || songList.length || 1,
      total: total || songList.length,
      source: 'mg',
      info: {
        name: listInfo.name || '',
        img: listInfo.image || null,
        desc: listInfo.desc || '',
        author: listInfo.author || '',
        play_count: listInfo.play_count || '',
      },
    }
  },
  /**
   * 通过AlbumId获取专辑信息
   * @param {*} id
   */
  async getAlbumInfo(id) {
    const info = await createHttpFetch(`https://app.c.nf.migu.cn/MIGUM3.0/resource/album/v2.0?albumId=${id}`)
    if (!info) return Promise.reject(new Error('Get album info error.'))

    return {
      name: info.title || info.albumName || '',
      image: info.imgItems && info.imgItems.length ? info.imgItems[0].img : null,
      desc: info.summary || info.desc || '',
      author: info.singer || '',
      play_count: info.opNumItem && info.opNumItem.playNum ? formatPlayCount(info.opNumItem.playNum) : '',
      total: info.totalCount || 0,
    }
  },
}
