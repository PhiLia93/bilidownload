import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useVideoStore = defineStore('video', () => {
    const videoInfo = ref(null)
    const setVideoInfo = (info: any) => { videoInfo.value = info }
    return { videoInfo, setVideoInfo }
})