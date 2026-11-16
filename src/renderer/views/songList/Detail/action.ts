import { tempListMeta, userLists } from '@renderer/store/list/state'
import { dialog } from '@renderer/plugins/Dialog'
import syncSourceList from '@renderer/store/list/syncSourceList'
import { getListDetail, getListDetailAll } from '@renderer/store/songList/action'
import { createUserList, setTempList } from '@renderer/store/list/action'
import { clearPlayedList } from '@renderer/store/player/action'
import { playList } from '@renderer/core/player/action'
import { LIST_IDS } from '@common/constants'
import { toMD5 } from '@renderer/utils'

const getListId = (id: string, source: LX.OnlineSource) => `${source}__${id}`

export const addSongListDetail = async(id: string, source: LX.OnlineSource, name?: string) => {
  // console.log(this.listDetail.info)
  // if (!this.listDetail.info.name) return
  const listId = getListId(id, source)
  const targetList = userLists.find(l => l.sourceListId == listId)
  if (targetList) {
    const confirm = await dialog.confirm({
      message: window.i18n.t('duplicate_list_tip', { name: targetList.name }),
      cancelButtonText: window.i18n.t('lists__import_part_button_cancel'),
      confirmButtonText: window.i18n.t('confirm_button_text'),
    })
    if (!confirm) return
    void syncSourceList(targetList)
    return
  }

  const list = await getListDetailAll(id, source)
  await createUserList({
    name,
    id: `${source}_${toMD5(listId)}`,
    list,
    source,
    sourceListId: id,
  })
}

export const playSongListDetail = async(id: string, source: LX.OnlineSource, list?: LX.Music.MusicInfoOnline[], index: number = 0) => {
  let isPlayingList = false
  // console.log(list)
  const listId = getListId(id, source)
  // 临时列表要换成另一张专辑/歌手时先清空已播放记录：播放队列的 listId 始终是 temp，
  // playList 内部的「列表切换则清空」判断不会生效，上一张专辑里已播放的歌曲会留在
  // playedList 中，导致新列表里的同名歌曲在下一首/随机播放时被当成已播放而跳过
  if (tempListMeta.id && tempListMeta.id != listId) clearPlayedList()
  if (!list?.length) list = (await getListDetail(id, source, 1)).list
  if (list?.length) {
    await setTempList(listId, [...list])
    playList(LIST_IDS.TEMP, index)
    isPlayingList = true
  }
  const fullList = await getListDetailAll(id, source)
  if (!fullList.length) return
  if (isPlayingList) {
    if (tempListMeta.id == listId) {
      await setTempList(listId, [...fullList])
    }
  } else {
    await setTempList(listId, [...fullList])
    playList(LIST_IDS.TEMP, index)
  }
}
