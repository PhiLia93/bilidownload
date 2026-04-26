<script setup lang="ts">
    import { useVideoStore } from '@/stores/videoinfo'
    import { useRouter } from 'vue-router';

    const router = useRouter();

    // 从pinia那边拉取解析的视频信息
    const videoStore = useVideoStore()
    console.log('message/videoInfo:', videoStore.videoInfo)
    // 设置视频清晰度列表，供选择
    const videoDescription = videoStore.videoInfo.description
    

    // 原时常数据是秒，这里转化成拟人一点的显示方式
    function formatDuration(seconds: number): string {
        if (seconds < 60) {
            return `${seconds}秒`
        }
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        if (mins < 60) {
            return secs > 0 ? `${mins}分${secs}秒` : `${mins}分钟`
        }
        const hours = Math.floor(mins / 60)
        const remainMins = mins % 60
        let result = `${hours}小时`
        if (remainMins > 0) result += `${remainMins}分`
        if (secs > 0) result += `${secs}秒`
        return result
    }

    // 返回BV检索界面
    async function gobackHome() {
        router.push({ path: '/' })
    }
    async function downloadThisVideo() {
        
    }
</script>

<template>
    <div class="videoInfo-container">
        <div class="video-info">
            <!-- 封面图片用referrerpolicy="no-referrer"解决B站防盗链问题，否则无法显示 -->
            <img :src="videoStore.videoInfo.pic" class="video-cover" referrerpolicy="no-referrer">
            <div class="theMessage">
                <h3>{{ videoStore.videoInfo.title }}</h3>
                <p>视频作者：{{ videoStore.videoInfo.author }}</p>
                <p>视频时长：{{ formatDuration(videoStore.videoInfo.duration) }}</p>
            </div>
            <div class="goback-or-download">
                <el-button type="primary" @click="gobackHome"> 重新搜索 </el-button>
                <el-button type="primary" @click="downloadThisVideo"> 下载视频 </el-button>
                <select class="sharpness-select">
                    <option v-for="item in videoDescription" :key="item" >{{ item }}</option>
                </select>
            </div>
        </div>
    </div>
</template>

<style scoped>
    .videoInfo-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 80vh;
    }
    .video-info {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 30px;
        background: rgba(255, 255, 255, 0.85);
        border-radius: 15px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }
    .video-cover {
        width: 320px;
        border-radius: 8px;
    }
    h3 {
        width: 320px;
        color: #333;
        margin: 10px 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    p {
        color: #666;
        margin: 5px 0;
    }
    .goback-or-download {
        display: flex;
        align-items: center;
        margin-top: 15px;
    }
    .sharpness-select {
        margin-left: 12px;
        width: 120px;
        height: 32px;
    }
</style>