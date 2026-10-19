import { httpFetch } from '../../request'
import { decodeName, formatPlayCount } from '../../index'
import { objStr2JSON } from './util'

export default {
  limit: 20,
  formatPlayCount(num) {
    num = parseInt(num)
    if (isNaN(num)) return 0
    if (num > 100000000) return parseInt(num / 10000000) / 10 + '亿'
    if (num > 10000) return parseInt(num / 1000) / 10 + '万'
    return num
  },
  search(text, page, limit = 20) {
    return httpFetch(`http://search.kuwo.cn/r.s?all=${encodeURIComponent(text)}&pn=${page - 1}&rn=${limit}&rformat=json&encoding=utf8&ver=mbox&vipver=MUSIC_8.7.7.0_BCS37&plat=pc&devid=28156413&ft=album&pay=0&needliveshow=0`)
      .promise.then(({ body }) => {
        body = objStr2JSON(body)
        if (!body || !body.albumlist) return { list: [], total: 0, limit, source: 'kw' }
        return {
          list: body.albumlist.map(item => ({
            play_count: this.formatPlayCount(item.PLAYCNT),
            id: `digest-13__${item.albumid}`,
            author: decodeName(item.artist),
            name: decodeName(item.name),
            total: parseInt(item.musiccnt) || 0,
            img: item.img || item.hts_img,
            desc: decodeName(item.info),
            source: 'kw',
          })),
          limit,
          total: parseInt(body.TOTAL) || body.albumlist.length,
          source: 'kw',
        }
      })
  },
}
