import { reactive } from '@common/utils/vueTools'

export {
  allMusicList,
  defaultList,
  loveList,
  tempList,
  userLists,
} from '@renderer/store/list/listManage'
// import { reactive, ref, markRaw, Ref } from '@common/utils/vueTools'

// // const TEMP_LIST = 'TEMP_LIST'

// export const isInitedList: Ref<boolean> = ref(false)

// export const allList: Map<string, LX.Music.MusicInfo[]> = window.lxData.allList = markRaw(new Map())

// export const defaultList: Omit<LX.List.MyDefaultListInfo, 'list'> = reactive({
//   id: 'default',
//   name: '试听列表',
// })

// export const loveList: Omit<LX.List.MyLoveListInfo, 'list'> = reactive({
//   id: 'love',
//   name: '我的收藏',
// })

// export const tempList: Omit<LX.List.MyTempListInfo, 'list'> = reactive({
//   id: 'temp',
//   name: '临时列表',
//   meta: {},
// })

/**
 * 临时列表（TEMP）当前承载的来源列表 id，形如 `wy__album__xxx`。
 * 设为响应式，播放列表面板等需要跟随「当前播放的是哪个专辑/歌单」刷新的地方才能监听到变化。
 */
export const tempListMeta = reactive({
  id: '',
})


// export const userLists: LX.List.UserListInfo[] = window.lxData.userLists = reactive([])

export const fetchingListStatus = reactive<Record<string, boolean>>({})

export const listUpdateTimes = reactive<Record<string, string>>({})
