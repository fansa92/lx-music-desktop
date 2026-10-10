<template>
  <div :class="$style.pic">
    <img
      v-if="url && !loadError" :class="$style.img" :src="url"
      loading="lazy" decoding="async" @error="handleError"
    >
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
</style>
