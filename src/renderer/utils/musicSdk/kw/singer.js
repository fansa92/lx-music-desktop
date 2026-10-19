import { httpFetch } from '../../request'
import { decodeName, formatPlayTime } from '../../index'
import { formatSinger, objStr2JSON } from './util'

export default {
  // 单页条数：artist2music 支持 pn/rn 分页，详情页据此分页
  limit_song: 100,
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
    const requestObj = httpFetch(`http://search.kuwo.cn/r.s?pn=${page - 1}&rn=${this.limit_song}&stype=artist2music&artistid=${id}&show_copyright_off=0&encoding=utf&vipver=MUSIC_9.1.0`)
    return requestObj.promise.then(({ statusCode, body }) => {
      if (statusCode !== 200) return this.getArtistDetail(id, page, ++retryNum)
      body = objStr2JSON(body)
      if (!body.musiclist) return this.getArtistDetail(id, page, ++retryNum)
      const artistName = decodeName(body.artist)
      const list = this.filterListDetail(body.musiclist)
      const total = parseInt(body.total) || list.length
      return this.getArtistInfo(id).then(artistInfo => ({
        list,
        page,
        limit: this.limit_song,
        total,
        source: 'kw',
        info: {
          name: artistName || artistInfo.name,
          img: artistInfo.img || '',
          // artistinfo 的 info/desc 就是歌手简介
          desc: artistInfo.desc || '',
          author: artistName || artistInfo.name,
          play_count: '',
        },
      }))
    })
  },
  /**
   * 获取歌手专辑列表
   * kw 没有按 artistid 取专辑的可用接口，改为按歌手名检索专辑，再用 artistid 过滤
   * @param {*} id
   * @param {*} page
   * @param {*} limit
   */
  getAlbumList(id, page = 1, limit = 50) {
    return this.getArtistInfo(id).then(artistInfo => {
      const name = artistInfo.name
      if (!name) return { list: [], total: 0, limit, page, source: 'kw' }
      return httpFetch(`http://search.kuwo.cn/r.s?all=${encodeURIComponent(name)}&ft=album&pn=${page - 1}&rn=${limit}&rformat=json&encoding=utf8&plat=pc&devid=28156413`)
        .promise.then(({ body }) => {
          body = objStr2JSON(body)
          const raw = (body && body.albumlist) || []
          const filterList = item => String(item.artistid) === String(id)
          const matched = raw.filter(filterList)
          // 过滤后为空时退回未过滤结果，避免同名/合作专辑被全部丢弃
          const list = (matched.length ? matched : raw).map(item => ({
            id: item.albumid,
            count: parseInt(item.musiccnt) || 0,
            info: {
              name: decodeName(item.name),
              author: decodeName(item.artist),
              img: item.hts_img || item.img,
              desc: decodeName(item.info),
            },
          }))
          return { list, total: list.length, limit, page, source: 'kw' }
        })
    }).catch(() => ({ list: [], total: 0, limit, page, source: 'kw' }))
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
          desc: decodeName(body.info || body.desc),
        }
      }).catch(() => ({ name: '', img: '', desc: '' }))
  },
}
