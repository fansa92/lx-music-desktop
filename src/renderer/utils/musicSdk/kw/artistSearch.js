import { httpFetch } from '../../request'
import { decodeName } from '../../index'
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
    return httpFetch(`http://search.kuwo.cn/r.s?all=${encodeURIComponent(text)}&pn=${page - 1}&rn=${limit}&rformat=json&encoding=utf8&ver=mbox&vipver=MUSIC_8.7.7.0_BCS37&plat=pc&devid=28156413&ft=artist&pay=0&needliveshow=0`)
      .promise.then(({ body }) => {
        body = objStr2JSON(body)
        if (!body || !body.abslist) return { list: [], total: 0, limit, source: 'kw' }
        return {
          list: body.abslist.map(item => ({
            play_count: this.formatPlayCount(item.SONGNUM),
            id: `artist__${item.ARTISTID}`,
            author: '',
            name: decodeName(item.ARTIST),
            time: '',
            img: item.hts_PICPATH || item.PICPATH,
            total: parseInt(item.SONGNUM) || 0,
            desc: decodeName(item.desc),
            source: 'kw',
          })),
          limit,
          total: parseInt(body.TOTAL) || body.abslist.length,
          source: 'kw',
        }
      })
  },
}
