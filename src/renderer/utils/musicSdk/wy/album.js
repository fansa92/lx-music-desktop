import { weapi } from './utils/crypto'
import { httpFetch } from '../../request'
import { formatPlayTime, sizeFormate, formatPlayCount } from '../../index'
import { formatSingerName } from '../utils'

export default {
  limit_song: 1000,
  async getAlbumDetail(id, page = 1, retryNum = 0) {
    if (retryNum > 2) return Promise.reject(new Error('try max num'))
    const { statusCode, body } = await httpFetch('https://music.163.com/weapi/v1/album/' + id, {
      method: 'post',
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
        Referer: 'https://music.163.com/',
      },
      form: weapi({}),
    }).promise
    if (statusCode !== 200 || body.code !== 200) return this.getAlbumDetail(id, page, ++retryNum)
    const songs = body.songs || []
    const album = body.album || (songs[0] && songs[0].al) || {}
    const list = this.filterListDetail({ songs, privileges: body.privileges })
    return {
      list,
      page,
      limit: list.length || 1,
      total: list.length,
      source: 'wy',
      info: {
        play_count: formatPlayCount(album.playCount),
        name: album.name,
        img: album.picUrl,
        desc: album.description,
        author: (album.artist && (album.artist.name || album.artist)) || (songs[0] ? formatSingerName(songs[0].ar, 'name') : ''),
      },
    }
  },
  filterListDetail({ songs, privileges }) {
    // console.log(songs, privileges)
    const list = []
    songs.forEach((item, index) => {
      const types = []
      const _types = {}
      const privilege = privileges && privileges[index]
      if (privilege) {
        if (privilege.maxBrLevel == 'hires') {
          const size = item.hr ? sizeFormate(item.hr.size) : null
          types.push({ type: 'flac24bit', size })
          _types.flac24bit = { size }
        }
        switch (privilege.maxbr) {
          case 999000:
          { const size = null; types.push({ type: 'flac', size }); _types.flac = { size } }
          // eslint-disable-next-line no-fallthrough
          case 320000:
          { const size = item.h ? sizeFormate(item.h.size) : null; types.push({ type: '320k', size }); _types['320k'] = { size } }
          // eslint-disable-next-line no-fallthrough
          case 192000:
          case 128000:
          { const size = item.l ? sizeFormate(item.l.size) : null; types.push({ type: '128k', size }); _types['128k'] = { size } }
        }
        types.reverse()
      }

      if (item.pc) {
        list.push({
          singer: item.pc.ar ?? '',
          name: item.pc.sn ?? '',
          albumName: item.pc.alb ?? '',
          albumId: item.al?.id,
          source: 'wy',
          interval: formatPlayTime(item.dt / 1000),
          songmid: item.id,
          img: item.al?.picUrl ?? '',
          lrc: null,
          otherSource: null,
          types,
          _types,
          typeUrl: {},
        })
      } else {
        list.push({
          singer: formatSingerName(item.ar, 'name'),
          name: item.name ?? '',
          albumName: item.al?.name,
          albumId: item.al?.id,
          source: 'wy',
          interval: formatPlayTime(item.dt / 1000),
          songmid: item.id,
          img: item.al?.picUrl,
          lrc: null,
          otherSource: null,
          types,
          _types,
          typeUrl: {},
        })
      }
    })
    return list
  },
}
