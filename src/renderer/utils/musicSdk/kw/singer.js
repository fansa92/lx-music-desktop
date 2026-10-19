import { httpFetch } from '../../request'
import { decodeName } from '../../index'
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
        interval: null,
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
    const requestObj = httpFetch(`http://search.kuwo.cn/r.s?pn=${page - 1}&rn=${this.limit_song}&stype=artist2music&artistid=${id}&show_copyright_off=0&encoding=utf&vipver=MUSIC_9.1.0`)
    return requestObj.promise.then(({ statusCode, body }) => {
      if (statusCode !== 200) return this.getArtistDetail(id, page, ++retryNum)
      body = objStr2JSON(body)
      if (!body.musiclist) return this.getArtistDetail(id, page, ++retryNum)
      const artistName = decodeName(body.artist)
      return this.getArtistInfo(id).then(artistInfo => ({
        list: this.filterListDetail(body.musiclist),
        page,
        limit: this.limit_song,
        total: parseInt(body.total) || body.musiclist.length,
        source: 'kw',
        info: {
          name: artistName,
          img: artistInfo.img || '',
          desc: '',
          author: artistName,
          play_count: '',
        },
      }))
    })
  },
  getArtistInfo(id) {
    return httpFetch(`http://search.kuwo.cn/r.s?stype=artistinfo&artistid=${id}&rformat=json&encoding=utf8&plat=pc&devid=28156413`)
      .promise.then(({ body }) => {
        body = objStr2JSON(body)
        return {
          name: decodeName(body.artist || body.name),
          img: body.img || body.pic || body.hts_PICPATH || '',
        }
      }).catch(() => ({ name: '', img: '' }))
  },
}
