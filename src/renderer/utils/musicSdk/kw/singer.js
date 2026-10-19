import { httpFetch } from '../../request'
import { decodeName, formatPlayTime } from '../../index'
import { formatSinger, objStr2JSON } from './util'

export default {
  limit_song: 1000,
  filterListDetail(rawList) {
    return rawList.map((item) => {
      let formats = item.formats.split('|')
      let types = []
      let _types = {}
      if (formats.includes('MP3128')) {
        types.push({ type: '128k', size: null })
        _types['128k'] = {
          size: null,
        }
      }
      if (formats.includes('MP3H')) {
        types.push({ type: '320k', size: null })
        _types['320k'] = {
          size: null,
        }
      }
      if (formats.includes('ALFLAC')) {
        types.push({ type: 'flac', size: null })
        _types.flac = {
          size: null,
        }
      }
      if (formats.includes('HIRFLAC')) {
        types.push({ type: 'flac24bit', size: null })
        _types.flac24bit = {
          size: null,
        }
      }
      return {
        singer: formatSinger(decodeName(item.artist)),
        name: decodeName(item.name),
        albumName: decodeName(item.album),
        albumId: item.albumid,
        songmid: item.musicrid,
        source: 'kw',
        // artist2music 返回的 duration 为秒数字符串
        interval: formatPlayTime(parseInt(item.duration) || 0),
        img: item.img,
        lrc: null,
        otherSource: null,
        types,
        _types,
        typeUrl: {},
      }
    })
  },
  getArtistDetail(id, page = 1, retryNum = 0) {
    if (retryNum > 2) return Promise.reject(new Error('try max num'))
    const requestObj = httpFetch(`http://search.kuwo.cn/r.s?pn=0&rn=${this.limit_song}&stype=artist2music&artistid=${id}&show_copyright_off=0&encoding=utf&vipver=MUSIC_9.1.0`)
    return requestObj.promise.then(({ statusCode, body }) => {
      if (statusCode !== 200) return this.getArtistDetail(id, page, ++retryNum)
      body = objStr2JSON(body)
      if (!body.musiclist) return this.getArtistDetail(id, page, ++retryNum)
      const artistName = decodeName(body.artist)
      const list = this.filterListDetail(body.musiclist)
      return this.getArtistInfo(id).then(artistInfo => ({
        list,
        page: 1,
        // 一次取满，让 total == limit，避免播放全部时逐页串联请求
        limit: list.length || 1,
        total: list.length,
        source: 'kw',
        info: {
          name: artistName || artistInfo.name,
          img: artistInfo.img || '',
          desc: '',
          author: artistName || artistInfo.name,
          play_count: '',
        },
      }))
    })
  },
  getArtistInfo(id) {
    return httpFetch(`http://search.kuwo.cn/r.s?stype=artistinfo&artistid=${id}&rformat=json&encoding=utf8&plat=pc&devid=28156413`)
      .promise.then(({ body }) => {
        body = objStr2JSON(body)
        // hts_pic 是完整地址；pic 是相对路径（如 120/s4s56/58/xxx.jpg），需补图片 host
        let img = body.hts_pic || ''
        if (!img && body.pic) img = `https://img1.kuwo.cn/star/starheads/${body.pic.replace(/^\/+/, '')}`
        return {
          name: decodeName(body.name || body.artist),
          img,
        }
      }).catch(() => ({ name: '', img: '' }))
  },
}
