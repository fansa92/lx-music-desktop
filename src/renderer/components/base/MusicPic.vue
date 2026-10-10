<template>
  <div :class="$style.pic">
    <img
      v-if="url && !loadError" :class="$style.img" :src="url"
      loading="lazy" decoding="async" @error="handleError"
    >
    <!-- 没有封面（或加载失败）时显示 LX 占位，避免列表出现空白 -->
    <div v-else :class="$style.placeholder">LX</div>
  </div>
</template>

<script>
import { computed, ref, watch } from '@common/utils/vueTools'
import useMusicPic from '@renderer/utils/compositions/useMusicPic'

export default {
  name: 'BaseMusicPic',
  props: {
    musicInfo: {
      type: Object,
      required: true,
    },
    listId: {
      type: String,
      default: null,
    },
  },
  setup(props) {
    const { getPicUrl } = useMusicPic({ getListId: () => props.listId })
    const loadError = ref(false)

    watch(() => props.musicInfo, () => {
      loadError.value = false
    })

    const url = computed(() => getPicUrl(props.musicInfo))

    return {
      url,
      loadError,
      handleError: () => {
        loadError.value = true
      },
    }
  },
}
</script>

<style lang="less" module>
.pic {
  flex: none;
  height: 100%;
  aspect-ratio: 1 / 1;
  padding: 3px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 3px;
  display: block;
  box-shadow: 0 0 2px 0 rgba(0, 0, 0, .2);
}
.placeholder {
  width: 100%;
  height: 100%;
  border-radius: 3px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  // 背景用主题色的淡色调，文字用会自动随明暗主题反转的灰阶，保证任何主题下都可读
  background-color: var(--color-primary-alpha-900);
  color: var(--color-800);
  font-size: .82em;
  font-weight: bold;
  letter-spacing: .5px;
  line-height: 1;
  user-select: none;
  box-shadow: 0 0 2px 0 rgba(0, 0, 0, .2);
}
</style>
