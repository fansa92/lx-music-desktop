import { eapiRequest } from './utils/index'
import { formatPlayCount } from '../../index'

export default {
  limit: 20,
  search(text, page, limit = 20) {
    return eapiRequest('/api/cloudsearch/pc', {
      s: text,
      type: 100, // 1: 单曲, 10: 专辑, 100: 歌手, 1000: 歌单
      limit,
      total: page == 1,
      offset: limit * (page - 1),
    }).promise.then(({ body }) => {
      if (body.code != 200) throw new Error('search artist failed')
      const artists = (body.result && body.result.artists) || []
      return {
        list: artists.map(item => ({
          play_count: formatPlayCount(item.musicSize ?? 0),
          id: `artist__${item.id}`,
          author: (item.alias && item.alias.length ? item.alias.join(' / ') : '') || (item.trans || ''),
          name: item.name,
          time: '',
          img: item.picUrl,
          total: item.musicSize,
          desc: '',
          source: 'wy',
        })),
        limit,
        total: (body.result && body.result.artistCount) || artists.length,
        source: 'wy',
      }
    })
  },
}
