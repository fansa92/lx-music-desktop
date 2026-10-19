import { createHttpFetch } from './utils'

export default {
  limit: 20,
  search(text, page, limit = 20) {
    return createHttpFetch(`https://pd.musicapp.migu.cn/MIGUM2.0/v1.0/content/search_all.do?searchSwitch=%7B%22song%22%3A0%2C%22album%22%3A1%2C%22singer%22%3A0%2C%22songlist%22%3A0%7D&pageSize=${limit}&text=${encodeURIComponent(text)}&pageNo=${page}`)
      .then(body => {
        if (!body.albumResultData) throw new Error('search album failed')
        const result = body.albumResultData.result || []
        return {
          list: result.map(item => ({
            play_count: null,
            id: `album__${item.id}`,
            author: item.singer,
            name: item.name,
            time: item.publishDate,
            img: item.imgItems?.length ? item.imgItems[0].img : null,
            // mg 搜索结果不带歌曲数（需逐个查专辑详情），这里留空避免显示错误的 0
            total: null,
            desc: item.desc,
            source: 'mg',
          })),
          limit,
          total: parseInt(body.albumResultData.totalCount) || result.length,
          source: 'mg',
        }
      })
  },
}
