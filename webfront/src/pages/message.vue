<script setup lang="ts">
    import { useVideoStore } from '@/stores/videoinfo'
    const videoStore = useVideoStore()
    console.log(videoStore.videoInfo)
</script>

<template>
    <div class="container">
        <h1>消息中心</h1>
    </div>
</template>

<style scoped>

</style>