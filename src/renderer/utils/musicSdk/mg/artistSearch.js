import { createHttpFetch } from './utils'

export default {
  limit: 20,
  search(text, page, limit = 20) {
    return createHttpFetch(`https://pd.musicapp.migu.cn/MIGUM2.0/v1.0/content/search_all.do?searchSwitch=%7B%22song%22%3A0%2C%22album%22%3A0%2C%22singer%22%3A1%2C%22songlist%22%3A0%7D&pageSize=${limit}&text=${encodeURIComponent(text)}&pageNo=${page}`)
      .then(body => {
        if (!body.singerResultData) throw new Error('search singer failed')
        const result = body.singerResultData.result || []
        return {
          list: result.map(item => ({
            play_count: null,
            id: `artist__${item.id}`,
            author: '',
            name: item.name,
            time: '',
            img: null,
            // mg 没有可用的歌手统计接口（相关路由均返回 299996），这里留空避免显示错误的 0
            total: null,
            desc: '',
            source: 'mg',
          })),
          limit,
          total: parseInt(body.singerResultData.totalCount) || result.length,
          source: 'mg',
        }
      })
  },
}
