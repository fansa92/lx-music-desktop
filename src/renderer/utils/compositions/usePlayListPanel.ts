import { ref } from '@common/utils/vueTools'

// 播放列表面板的显示状态需要被播放条按钮、面板自身共用，
// 而三种播放条样式（mini / middle / full）是各自独立的组件树，
// 所以这里用模块级状态保证只有一个开关。
export const isShowPlayListPanel = ref(false)

export const setShowPlayListPanel = (val: boolean) => {
  isShowPlayListPanel.value = val
}

export const togglePlayListPanel = () => {
  isShowPlayListPanel.value = !isShowPlayListPanel.value
}

export default () => {
  return {
    isShowPlayListPanel,
    setShowPlayListPanel,
    togglePlayListPanel,
  }
}
