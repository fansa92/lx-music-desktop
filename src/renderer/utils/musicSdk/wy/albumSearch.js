import { eapiRequest } from './utils/index'
import { formatPlayCount, dateFormat } from '../../index'

export default {
  limit: 20,
  search(text, page, limit = 20) {
    return eapiRequest('/api/cloudsearch/pc', {
      s: text,
      type: 10, // 1: 单曲, 10: 专辑, 100: 歌手, 1000: 歌单
      limit,
      total: page == 1,
      offset: limit * (page - 1),
    }).promise.then(({ body }) => {
      if (body.code != 200) throw new Error('search album failed')
      const albums = (body.result && body.result.albums) || []
      return {
        list: albums.map(item => ({
          play_count: formatPlayCount(item.playCount ?? 0),
          id: `album__${item.id}`,
          author: item.artist?.name ?? '',
          name: item.name,
          time: item.publishTime ? dateFormat(item.publishTime, 'Y-M-D') : '',
          img: item.picUrl,
          total: item.size,
          desc: item.description ?? '',
          source: 'wy',
        })),
        limit,
        total: (body.result && body.result.albumCount) || albums.length,
        source: 'wy',
      }
    })
  },
}
