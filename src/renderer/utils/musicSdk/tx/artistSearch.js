import { signRequest } from './utils'

export default {
  limit: 20,
  search(text, page, limit = 20) {
    const searchRequest = signRequest({
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
          search_type: 1, // 0: 歌曲, 1: 歌手, 2: 专辑, 3: 歌单, 4: mv
          searchid: this.getSearchId(),
        },
      },
    })
    return searchRequest.then(({ body }) => {
      const req = body?.['music.search.SearchCgiService']
      if (!req || req.code != 0) throw new Error('search artist failed')
      const singerData = req.data?.body?.singer
      const singerList = singerData?.list || []
      // 该接口的歌手项字段为 singerName / singerPic / songNum（不是 name / img）
      return {
        list: singerList.map(item => {
          const name = item.singerName || item.name || ''
          return {
            play_count: null,
            id: `artist__${item.singerMID}`,
            author: name,
            name,
            time: '',
            img: item.singerPic || `https://y.gtimg.cn/music/photo_new/T001R500x500M000${item.singerMID}.jpg`,
            total: item.songNum ?? 0,
            album_total: item.albumNum ?? 0,
            desc: '',
            source: 'tx',
          }
        }),
        limit,
        total: singerData?.totalnum ?? singerList.length,
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
