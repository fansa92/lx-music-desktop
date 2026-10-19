<template>
  <teleport to="#root">
    <transition enter-active-class="animated slideInUp" leave-active-class="animated slideOutDown">
      <div v-if="visible" ref="dom_panel" :class="$style.panel">
        <header :class="$style.header">
          <h3 :class="$style.title">{{ $t('player__play_list') }}</h3>
          <span :class="$style.count">{{ list.length }}</span>
          <button type="button" :class="$style.closeBtn" :aria-label="$t('close')" @click="close">
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 212.982 212.982" space="preserve">
              <use xlink:href="#icon-delete" />
            </svg>
          </button>
        </header>
        <div :class="$style.body">
          <div v-if="!list.length" :class="$style.empty">{{ $t('no_item') }}</div>
          <div v-else :class="$style.listWrap">
            <base-virtualized-list
              ref="listRef"
              v-slot="{ item, index }"
              :list="list"
              key-name="id"
              :item-height="itemHeight"
              container-class="scroll"
              :content-class="$style.list"
            >
              <div :class="[$style.item, { [$style.active]: isCurrentPlay(item) }]" :aria-label="getMusicInfo(item).name" @click="handlePlay(index)">
                <div :class="$style.num">
                  <svg v-if="isCurrentPlay(item)" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 24 24" space="preserve">
                    <use xlink:href="#icon-audio-wave" />
                  </svg>
                  <span v-else>{{ index + 1 }}</span>
                </div>
                <div :class="$style.info">
                  <span :class="$style.name">{{ getMusicInfo(item).name }}</span>
                  <span :class="$style.singer">{{ getMusicInfo(item).singer }}</span>
                </div>
                <button
                  v-if="canRemove"
                  type="button"
                  :class="$style.removeBtn"
                  :aria-label="$t('player__play_list_remove')"
                  @click.stop="handleRemove(item)"
                >
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 212.982 212.982" space="preserve">
                    <use xlink:href="#icon-delete" />
                  </svg>
                </button>
              </div>
            </base-virtualized-list>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script>
import { computed, nextTick, ref, watch, onBeforeUnmount } from '@common/utils/vueTools'
import { appSetting } from '@renderer/store/setting'
import { playInfo, playMusicInfo } from '@renderer/store/player/state'
import { downloadList } from '@renderer/store/download/state'
import { getListMusics, getListMusicsFromCache, removeListMusics } from '@renderer/store/list/action'
import { isFullscreen } from '@renderer/store'
import { getFontSizeWithScreen } from '@renderer/utils'
import { playList } from '@renderer/core/player'
import { LIST_IDS } from '@common/constants'
import { isShowPlayListPanel, setShowPlayListPanel } from '@renderer/utils/compositions/usePlayListPanel'

export default {
  name: 'PlayListPanel',
  setup() {
    const visible = isShowPlayListPanel
    const dom_panel = ref(null)
    const listRef = ref(null)
    const list = ref([])
    let shouldScrollToCurrent = false

    // playerListId 在某些播放路径下可能为空，兜底用当前播放歌曲所属的列表
    const listId = computed(() => playInfo.playerListId ?? playMusicInfo.listId ?? null)
    // 下载列表的歌曲是 LX.Download.ListItem，删除走的是下载模块，这里不提供移除按钮
    const canRemove = computed(() => !!listId.value && listId.value != LIST_IDS.DOWNLOAD)
    const itemHeight = computed(() => Math.ceil((isFullscreen.value ? getFontSizeWithScreen() : appSetting['common.fontSize']) * 2.3))

    /**
     * 列表项可能是下载列表项，统一取出歌曲信息
     */
    const getMusicInfo = (item) => 'progress' in item ? item.metadata.musicInfo : item

    const currentPlayId = computed(() => playMusicInfo.musicInfo?.id ?? null)
    const isCurrentPlay = (item) => {
      const id = currentPlayId.value
      if (!id) return false
      return item.id == id || getMusicInfo(item).id == id
    }

    const loadList = async() => {
      const id = listId.value
      if (!id) {
        list.value = []
        return
      }
      // 下载列表本身是响应式的，直接绑定即可跟随变化
      if (id == LIST_IDS.DOWNLOAD) {
        list.value = downloadList
        return
      }
      // 与播放器播放时取列表的方式保持一致（同步缓存），保证拿到的就是当前播放的列表
      let musics = getListMusicsFromCache(id)
      if (!musics?.length) {
        try {
          musics = await getListMusics(id)
        } catch (err) {
          console.warn(err)
        }
      }
      // 列表可能已经通过事件被更新过，这里再取一次缓存兜底
      if (!musics?.length) musics = getListMusicsFromCache(id)
      list.value = musics ?? []
    }

    const scrollToCurrent = () => {
      const index = playInfo.playerPlayIndex
      if (index < 0 || !listRef.value) return
      // 让当前播放的歌曲尽量居中显示
      listRef.value.scrollToIndex(Math.max(index - 2, 0))
    }

    const close = () => {
      setShowPlayListPanel(false)
    }

    const handlePlay = (index) => {
      const id = listId.value
      if (!id) return
      playList(id, index)
    }

    const handleRemove = (item) => {
      const id = listId.value
      if (!id || id == LIST_IDS.DOWNLOAD) return
      void removeListMusics({ listId: id, ids: [item.id] }).then(loadList)
    }

    const handleOutsideClick = (event) => {
      if (!dom_panel.value) return
      if (dom_panel.value.contains(event.target)) return
      // 播放条上的列表按钮自己会切换状态，这里放过它避免「点击后立即关闭」
      if (event.target.closest?.('[data-play-list-btn]')) return
      close()
    }
    const handleKeydown = (event) => {
      if (event.key == 'Escape') close()
    }

    watch(visible, (val) => {
      if (val) {
        // 每次打开都重新定位到当前播放的歌曲
        shouldScrollToCurrent = true
        void loadList()
        // 延迟绑定，避免打开面板的那一次点击立刻触发关闭
        setTimeout(() => {
          document.addEventListener('click', handleOutsideClick, true)
          document.addEventListener('keydown', handleKeydown)
        }, 0)
      } else {
        document.removeEventListener('click', handleOutsideClick, true)
        document.removeEventListener('keydown', handleKeydown)
      }
    })

    // 面板打开期间切换了播放列表时同步刷新
    watch(listId, () => {
      if (!visible.value) return
      shouldScrollToCurrent = true
      void loadList()
    })

    // 列表是异步拉取的，等虚拟列表渲染出内容高度后再滚动
    watch(list, () => {
      if (!visible.value || !shouldScrollToCurrent) return
      shouldScrollToCurrent = false
      void nextTick(() => requestAnimationFrame(scrollToCurrent))
    })

    onBeforeUnmount(() => {
      document.removeEventListener('click', handleOutsideClick, true)
      document.removeEventListener('keydown', handleKeydown)
    })

    return {
      visible,
      dom_panel,
      listRef,
      list,
      itemHeight,
      canRemove,
      getMusicInfo,
      isCurrentPlay,
      close,
      handlePlay,
      handleRemove,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.panel {
  position: absolute;
  right: 10px;
  bottom: calc(@height-player + 4px);
  width: 340px;
  max-height: 62%;
  z-index: 20;
  display: flex;
  flex-flow: column nowrap;
  overflow: hidden;
  border-radius: @radius-border;
  box-shadow: 0 0 6px rgba(0, 0, 0, .3);
  background-color: var(--color-content-background);
  border: 1px solid var(--color-primary-alpha-900);
}

.header {
  flex: none;
  height: 36px;
  padding: 0 10px;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 8px;
  background-color: var(--color-primary-light-100-alpha-100);
  border-bottom: 1px solid var(--color-primary-alpha-900);
}

.title {
  flex: auto;
  margin: 0;
  font-size: 14px;
  font-weight: normal;
  color: var(--color-font);
}

.count {
  flex: none;
  font-size: 12px;
  color: var(--color-font-label);
}

.closeBtn {
  flex: none;
  height: 18px;
  width: 18px;
  padding: 3px;
  border: none;
  background-color: transparent;
  color: var(--color-primary-dark-500-alpha-500);
  cursor: pointer;
  line-height: 0;

  svg {
    fill: currentColor;
  }
  &:hover {
    color: var(--color-primary);
  }
}

.body {
  flex: auto;
  min-height: 0;
  position: relative;
  display: flex;
  flex-flow: column nowrap;
}

// 虚拟列表的内容是绝对定位的，这里用绝对定位的容器给它一个确定的高度，
// 避免 height: 100% 在 flex 布局里退化成 0
.listWrap {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
}

.empty {
  flex: none;
  padding: 24px 0;
  text-align: center;
  font-size: 13px;
  color: var(--color-font-label);
}

.list {
  width: 100%;
  overflow: hidden;
}

.item {
  height: 100%;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  box-sizing: border-box;
  font-size: 13px;
  color: var(--color-font);
  cursor: pointer;
  transition: background-color .2s ease;

  &:hover {
    background-color: var(--color-primary-background-hover);

    .removeBtn {
      opacity: .7;
    }
  }

  &.active {
    color: var(--color-primary);
    background-color: var(--color-primary-background-active);
  }
}

.num {
  flex: none;
  width: 20px;
  height: 52%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: var(--color-font-label);

  svg {
    fill: currentColor;
  }
}

.active .num {
  color: var(--color-primary);
}

.info {
  flex: auto;
  min-width: 0;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  line-height: 1.4;
}

.name {
  .mixin-ellipsis-1();
  max-width: 100%;
}
.singer {
  .mixin-ellipsis-1();
  max-width: 100%;
  font-size: 11px;
  color: var(--color-font-label);
}

.removeBtn {
  flex: none;
  height: 16px;
  width: 16px;
  padding: 0;
  border: none;
  background-color: transparent;
  color: var(--color-font-label);
  cursor: pointer;
  opacity: 0;
  transition: opacity @transition-fast;
  line-height: 0;

  svg {
    fill: currentColor;
  }
  &:hover {
    opacity: 1;
    color: var(--color-primary);
  }
}
</style>
