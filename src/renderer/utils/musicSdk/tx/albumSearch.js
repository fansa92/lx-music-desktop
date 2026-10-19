import { signRequest } from './utils'
import { formatPlayCount } from '../../index'

export default {
  limit: 20,
  search(text, page, limit = 20) {
    return signRequest({
      comm: {
        _channelid: '0',
        _os_version: '6.2.9200-2',
        ct: '19',
        cv: '2151',
        guid: '1F70E520B2EAA7D25E11760783C53CA9',
        patch: '118',
        psrf_access_token_expiresAt: 0,
        psrf_qqaccess_token: '',
        psrf_qqopenid: '',
        psrf_qqunionid: '',
        tmeAppID: 'qqmusic',
        tmeLoginType: 0,
        uin: '0',
        wid: '7223299733393904640',
      },
      'music.search.SearchCgiService': {
        module: 'music.search.SearchCgiService',
        method: 'DoSearchForQQMusicDesktop',
        param: {
          grp: 1,
          num_per_page: limit,
          page_num: page,
          query: text,
          remoteplace: 'txt.newclient.top',
          search_type: 2, // 0: 歌曲, 1: 歌手, 2: 专辑, 3: 歌单, 4: mv
          searchid: this.getSearchId(),
        },
      },
    }).then(({ body }) => {
      const req = body?.['music.search.SearchCgiService']
      if (!req || req.code != 0) throw new Error('search album failed')
      const albumData = req.data?.body?.album
      const albumList = albumData?.list || []
      return {
        list: albumList.map(item => {
          const albumMid = item.albumMID || item.albumMid || ''
          return {
            play_count: formatPlayCount(0),
            id: `album__${albumMid}`,
            author: item.singerName ?? '',
            name: item.albumName ?? '',
            time: item.publicTime ?? '',
            img: item.albumPic || `https://y.gtimg.cn/music/photo_new/T002R500x500M000${albumMid}.jpg`,
            // 该接口直接提供专辑歌曲数
            total: item.song_count ?? 0,
            desc: '',
            source: 'tx',
          }
        }),
        limit,
        // 该接口不返回精确总数，只有 meta.estimate_sum（预估值），用它驱动分页
        total: Number(req.data?.meta?.estimate_sum) || albumList.length,
        source: 'tx',
      }
    })
  },
  getSearchId() {
    let guid = ''
    for (let i = 0; i < 32; i++) guid += Math.floor(Math.random() * 16).toString(16)
    return guid.toUpperCase() + String(Math.floor(Math.random() * 100000)).padStart(5, '0')
  },
}
