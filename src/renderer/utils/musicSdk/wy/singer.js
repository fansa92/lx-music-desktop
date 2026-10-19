import { eapiRequest } from './utils/index'
import { formatPlayTime, sizeFormate } from '../../index'
import { formatSingerName } from '../utils'

export default {
  /**
   * 获取歌手信息
   * @param {*} id
   */
  getInfo(id) {
    return eapiRequest('/api/artist/head/info/get', { id }).promise.then(({ body }) => {
      // 该接口实际返回结构为 body.data.artist（旧版为 body.artist），两种都兼容
      const artist = (body && body.data && body.data.artist) || (body && body.artist)
      if (!body || body.code != 200 || !artist) throw new Error('get singer info faild.')
      return {
        source: 'wy',
        id: artist.id,
        info: {
          name: artist.name,
          desc: artist.briefDesc,
          avatar: artist.avatar || artist.cover || artist.picUrl,
        },
        count: {
          music: artist.musicSize ?? 0,
          album: artist.albumSize ?? 0,
        },
      }
    })
  },
  /**
   * 获取歌手歌曲列表
   * @param {*} id
   * @param {*} page
   * @param {*} limit
   */
  getSongList(id, page = 1, limit = 100) {
    return eapiRequest('/api/v2/artist/songs', {
      id,
      limit,
      offset: limit * (page - 1),
    }).promise.then(({ body }) => {
      if (!body || body.code != 200 || !Array.isArray(body.songs)) throw new Error('get singer song list faild.')

      const list = this.filterSongList(body.songs)
      return {
        list,
        limit,
        page,
        total: body.total ?? body.songs.length,
        source: 'wy',
      }
    })
  },
  async getArtistDetail(id, page = 1, limit = 100) {
    // 该接口单次最多返回 200 条，这里一次取满并让 total == limit，
    // 避免播放全部时逐页串行请求（歌手歌曲动辄上千首，会卡很久）
    limit = 200
    const [songData, infoData] = await Promise.all([
      this.getSongList(id, 1, limit).catch(() => null),
      this.getInfo(id).catch(() => null),
    ])
    const info = (infoData && infoData.info) || {}
    const list = (songData && songData.list) || []
    return {
      list,
      page: 1,
      limit: list.length || 1,
      total: list.length,
      source: 'wy',
      info: {
        name: info.name || '',
        img: info.avatar || '',
        desc: info.desc || '',
        author: info.name || '',
        play_count: '',
      },
    }
  },
  /**
   * 获取歌手专辑列表
   * @param {*} id
   * @param {*} page
   * @param {*} limit
   */
  getAlbumList(id, page = 1, limit = 10) {
    if (page === 1) page = 0
    return eapiRequest(`/api/artist/albums/${id}`, {
      limit,
      offset: limit * page,
    }).then(({ body }) => {
      if (!body.hotAlbums || body.code != 200) throw new Error('get singer album list faild.')

      const list = this.filterAlbumList(body.hotAlbums)
      return {
        source: 'wy',
        list,
        limit,
        page,
        total: body.artist.albumSize,
      }
    })
  },
  filterAlbumList(raw) {
    const list = []
    raw.forEach(item => {
      if (!item.id) return
      list.push({
        id: item.id,
        count: item.size,
        info: {
          name: item.name,
          author: formatSingerName(item.artists),
          img: item.picUrl,
          desc: null,
        },
      })
    })
    return list
  },
  filterSongList(raw) {
    const list = []
    raw.forEach(item => {
      if (!item.id) return

      const types = []
      const _types = {}
      let size
      const chargeInfoList = (item.privilege && item.privilege.chargeInfoList) || []
      chargeInfoList.forEach(i => {
        switch (i.rate) {
          case 128000:
            size = item.lMusic ? sizeFormate(item.lMusic.size) : null
            types.push({ type: '128k', size })
            _types['128k'] = {
              size,
            }
          case 320000:
            size = item.hMusic ? sizeFormate(item.hMusic.size) : null
            types.push({ type: '320k', size })
            _types['320k'] = {
              size,
            }
          case 999000:
            size = item.sqMusic ? sizeFormate(item.sqMusic.size) : null
            types.push({ type: 'flac', size })
            _types.flac = {
              size,
            }
          case 1999000:
            size = item.hrMusic ? sizeFormate(item.hrMusic.size) : null
            types.push({ type: 'flac24bit', size })
            _types.flac24bit = {
              size,
            }
        }
      })

      list.push({
        singer: formatSingerName(item.artists),
        name: item.name,
        albumName: (item.album && item.album.name) || '',
        albumId: (item.album && item.album.id) || '',
        songmid: item.id,
        source: 'wy',
        // 该接口的 duration 单位是毫秒，需先换算成秒
        interval: formatPlayTime((item.duration || 0) / 1000),
        img: (item.album && item.album.picUrl) || null,
        lrc: null,
        otherSource: null,
        types,
        _types,
        typeUrl: {},
      })
    })
    return list
  },
}
