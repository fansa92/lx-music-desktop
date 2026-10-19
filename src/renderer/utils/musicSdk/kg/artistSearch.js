import { httpFetch } from '../../request'
import { formatPlayCount } from '../../index'

export default {
  limit: 20,
  search(text, page, limit = 20) {
    return httpFetch(`http://mobilecdn.kugou.com/api/v3/search/singer?keyword=${encodeURIComponent(text)}&page=${page}&pagesize=${limit}&showtype=1&plat=0&version=9108`)
      .promise.then(({ body }) => {
        if (body.errcode != 0) throw new Error('search singer failed')
        const info = body.data.info || []
        return {
          list: info.map(item => ({
            play_count: formatPlayCount(0),
            id: `artist__${item.singerid}`,
            author: '',
            name: item.singername,
            time: '',
            img: item.imgurl.replace('{size}', '240'),
            total: item.songcount,
            desc: item.intro,
            source: 'kg',
          })),
          limit,
          total: body.data.total,
          source: 'kg',
        }
      })
  },
}
