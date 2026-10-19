import leaderboard from './leaderboard'
import { apis } from '../api-source'
import songList from './songList'
import albumSearch from './albumSearch'
import artistSearch from './artistSearch'
import musicSearch from './musicSearch'
import pic from './pic'
import lyric from './lyric'
import hotSearch from './hotSearch'
import comment from './comment'
import album from './album'
import singer from './singer'
// import tipSearch from './tipSearch'

const kg = {
  // tipSearch,
  leaderboard,
  songList,
  albumSearch,
  artistSearch,
  album,
  singer,
  musicSearch,
  hotSearch,
  comment,
  getMusicUrl(songInfo, type) {
    return apis('kg').getMusicUrl(songInfo, type)
  },
  getLyric(songInfo) {
    return lyric.getLyric(songInfo)
  },
  // getLyric(songInfo) {
  //   return apis('kg').getLyric(songInfo)
  // },
  getPic(songInfo) {
    return pic.getPic(songInfo)
  },
  getMusicDetailPageUrl(songInfo) {
    return `https://www.kugou.com/song/#hash=${songInfo.hash}&album_id=${songInfo.albumId}`
  },
  // getPic(songInfo) {
  //   return apis('kg').getPic(songInfo)
  // },
}

export default kg
