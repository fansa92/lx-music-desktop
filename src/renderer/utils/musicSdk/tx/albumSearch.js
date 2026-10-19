import { httpFetch } from '../../request'
import { decodeName, formatPlayCount } from '../../index'

export default {
  limit: 20,
  search(text, page, limit = 20) {
    return httpFetch(`http://c.y.qq.com/soso/fcgi-bin/search_for_qq_cp?t=8&p=${page}&n=${limit}&w=${encodeURIComponent(text)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)',
        Referer: 'http://y.qq.com/portal/search.html',
      },
    }).promise.then(({ body }) => {
      const data = typeof body == 'string'
        ? JSON.parse(body.replace(/^[^(]*\(/, '').replace(/\)\s*$/, ''))
        : body
      if (data.code != 0) throw new Error('search album failed')
      const list = (data.data.album && data.data.album.list) || []
      return {
        list: list.map(item => ({
          play_count: formatPlayCount(0),
          id: `album__${item.albumMID}`,
          author: decodeName(item.singerName),
          name: decodeName(item.albumName),
          time: item.publicTime || '',
          img: `https://y.gtimg.cn/music/photo_new/T002R500x500M000${item.albumMID}.jpg`,
          total: 0,
          desc: '',
          source: 'tx',
        })),
        limit,
        total: data.data.album ? data.data.album.totalnum : list.length,
        source: 'tx',
      }
    })
  },
}
