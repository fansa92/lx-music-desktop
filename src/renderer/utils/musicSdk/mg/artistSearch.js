import { createHttpFetch } from './utils'
import { createSignature } from './musicSearch'

// 咪咕 v3 搜索接口（App 端在用的那个），一次请求即可拿到歌手头像与歌曲/专辑数量
const SEARCH_SWITCH = JSON.stringify({
  song: 0,
  album: 0,
  singer: 1,
  tagSong: 0,
  mvSong: 0,
  bestShow: 0,
  songlist: 0,
  lyricSong: 0,
})

const getImg = (imgs) => {
  if (!imgs?.length) return null
  const item = imgs.find(img => img.imgSizeType == '02') ?? imgs[0]
  return item.img ?? null
}

export default {
  limit: 20,
  async search(text, page, limit = 20) {
    const time = Date.now().toString()
    const signData = createSignature(time, text)
    const body = await createHttpFetch(`https://jadeite.migu.cn/music_search/v3/search/searchAll?isCorrect=0&isCopyright=1&searchSwitch=${encodeURIComponent(SEARCH_SWITCH)}&pageSize=${limit}&text=${encodeURIComponent(text)}&pageNo=${page}&sort=0&sid=USS`, {
      headers: {
        uiVersion: 'A_music_3.6.1',
        deviceId: signData.deviceId,
        timestamp: time,
        sign: signData.sign,
        channel: '0146921',
        'User-Agent': 'Mozilla/5.0 (Linux; U; Android 11.0.0; zh-cn; MI 11 Build/OPR1.170623.032) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30',
      },
    })

    const result = body?.singerResultData ?? { result: [], totalCount: 0 }
    const list = (result.result ?? []).map(item => ({
      play_count: null,
      id: `artist__${item.id}`,
      author: '',
      name: item.name,
      time: '',
      img: getImg(item.singerPicUrl),
      total: item.songCount ?? null,
      album_total: item.albumCount ?? null,
      desc: '',
      source: 'mg',
    }))

    return {
      list,
      limit,
      total: parseInt(result.totalCount) || list.length,
      source: 'mg',
    }
  },
}
