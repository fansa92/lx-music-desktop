import { httpFetch } from '../../request'
import { decodeName, formatPlayTime, sizeFormate, formatPlayCount } from '../../index'
import { formatSingerName } from '../utils'

export default {
  limit_song: 1000,
  getAlbumDetail(albummid, page = 1) {
    return httpFetch(`https://c.y.qq.com/v8/fcg-bin/fcg_v8_album_info_cp.fcg?albummid=${albummid}&platform=yqq.json&needNewCode=0`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)',
        Referer: 'https://y.qq.com/',
      },
    }).promise.then(({ body }) => {
      if (body.code !== 0) throw new Error('get album detail failed')
      const data = body.data
      return {
        list: this.filterListDetail(data.list || []),
        page,
        limit: this.limit_song,
        total: data.total_song_num || data.cur_song_num || (data.list ? data.list.length : 0),
        source: 'tx',
        info: {
          name: data.name,
          img: `https://y.gtimg.cn/music/photo_new/T002R500x500M000${albummid}.jpg`,
          desc: decodeName(data.desc ?? '').replace(/<br>/g, '\n'),
          author: data.singername,
          play_count: formatPlayCount(data.cur_song_num),
        },
      }
    })
  },
  filterListDetail(rawList) {
    // console.log(rawList)
    return rawList.map(item => {
      let types = []
      let _types = {}
      if (item.size128 != null && item.size128 != 0) {
        let size = sizeFormate(item.size128)
        types.push({ type: '128k', size })
        _types['128k'] = { size }
      }
      if (item.size320 != null && item.size320 != 0) {
        let size = sizeFormate(item.size320)
        types.push({ type: '320k', size })
        _types['320k'] = { size }
      }
      if (item.sizeflac != null && item.sizeflac != 0) {
        let size = sizeFormate(item.sizeflac)
        types.push({ type: 'flac', size })
        _types.flac = { size }
      }
      if (item.size5_1 != null && item.size5_1 != 0) {
        let size = sizeFormate(item.size5_1)
        types.push({ type: 'flac24bit', size })
        _types.flac24bit = { size }
      }
      types.reverse()

      return {
        singer: formatSingerName(item.singer, 'name'),
        name: item.songname,
        albumName: item.albumname,
        albumId: item.albummid,
        source: 'tx',
        interval: formatPlayTime(item.interval),
        songId: item.songid,
        albumMid: item.albummid,
        strMediaMid: item.songmid,
        songmid: item.songmid,
        img: `https://y.gtimg.cn/music/photo_new/T002R500x500M000${item.albummid}.jpg`,
        lrc: null,
        otherSource: null,
        types,
        _types,
        typeUrl: {},
      }
    })
  },
}
