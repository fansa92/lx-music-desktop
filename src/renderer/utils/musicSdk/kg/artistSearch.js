import { httpFetch } from '../../request'
import { createHttpFetch } from './util'
import { formatPlayCount } from '../../index'

/**
 * 获取歌手头像、歌曲数等信息
 * 搜索接口本身不返回头像，需要逐个查询 singer/info 补齐
 * @param {*} singerid
 */
const getSingerExtraInfo = async(singerid) => {
  try {
    const body = await createHttpFetch(`http://mobiles.kugou.com/api/v5/singer/info?singerid=${singerid}`)
    if (!body) return {}
    return {
      img: body.imgurl ? body.imgurl.replace('{size}', 240) : null,
      total: body.songcount ?? 0,
      desc: body.intro ?? '',
    }
  } catch {
    return {}
  }
}

export default {
  limit: 20,
  async search(text, page, limit = 20) {
    const body = await httpFetch(`http://mobilecdn.kugou.com/api/v3/search/singer?keyword=${encodeURIComponent(text)}&page=${page}&pagesize=${limit}&showtype=1&plat=0&version=9108`).promise.then(({ body }) => body)
    if (body.errcode != 0) throw new Error('search singer failed')
    // 该接口的 data 直接是数组（不是 data.info），且项内只有 singername/singerid
    const data = body.data
    const info = Array.isArray(data) ? data : (data && data.info) || []

    const list = await Promise.all(info.map(async item => {
      const extra = await getSingerExtraInfo(item.singerid)
      return {
        play_count: formatPlayCount(0),
        id: `artist__${item.singerid}`,
        author: '',
        name: item.singername,
        time: '',
        img: extra.img ?? null,
        total: extra.total ?? 0,
        desc: extra.desc ?? '',
        source: 'kg',
      }
    }))

    return {
      list,
      limit,
      total: list.length,
      source: 'kg',
    }
  },
}
