import { createHttpFetch } from './utils'

/**
 * 搜索结果里没有歌曲数，逐个查专辑详情补上（数字专辑走 dalbum 接口）
 * 查询失败时返回 null，避免列表里显示错误的 0
 */
const getAlbumSongCount = async(id) => {
  try {
    const info = await createHttpFetch(`https://app.c.nf.migu.cn/MIGUM3.0/resource/album/v2.0?albumId=${id}`)
    const count = parseInt(info?.totalCount)
    if (count) return count
  } catch { /* 普通专辑接口失败时继续尝试数字专辑接口 */ }
  try {
    const info = await createHttpFetch(`https://app.u.nf.migu.cn/pc/resource/dalbum/v2.0?dAlbumId=${id}`)
    return parseInt(info?.totalCount) || null
  } catch {
    return null
  }
}

export default {
  limit: 20,
  async search(text, page, limit = 20) {
    const body = await createHttpFetch(`https://pd.musicapp.migu.cn/MIGUM2.0/v1.0/content/search_all.do?searchSwitch=%7B%22song%22%3A0%2C%22album%22%3A1%2C%22singer%22%3A0%2C%22songlist%22%3A0%7D&pageSize=${limit}&text=${encodeURIComponent(text)}&pageNo=${page}`)
    if (!body.albumResultData) throw new Error('search album failed')

    const result = body.albumResultData.result ?? []
    const totals = await Promise.all(result.map(item => getAlbumSongCount(item.id)))

    return {
      list: result.map((item, index) => ({
        play_count: null,
        id: `album__${item.id}`,
        author: item.singer,
        name: item.name,
        time: item.publishDate,
        img: item.imgItems?.length ? item.imgItems[0].img : null,
        total: totals[index],
        desc: item.desc,
        source: 'mg',
      })),
      limit,
      total: parseInt(body.albumResultData.totalCount) || result.length,
      source: 'mg',
    }
  },
}
