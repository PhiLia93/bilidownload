<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useVideoStore } from '@/stores/videoinfo'

const router = useRouter();
const videoStore = useVideoStore()

const searchQuery = ref('')     // 输入的BV号或视频链接
const loading = ref(false)      // 解析状态，true为正在解析
const message = ref('')         // 错误提示消息或成功提示消息
const videoInfo = ref(null)     // 视频信息对象，包含视频标题、描述、封面等

// 给后端发BV号
async function handleSearch() {
    // 检查输入是否为空
    if (!searchQuery.value.trim()) {
        console.log("输入不能为空")
        return
    }

    loading.value = true       // 执行请求函数，把状态调至解析中
    message.value = 'no message'         // 清空之前的错误提示消息
    videoInfo.value = null     // 清空之前的视频信息，避免显示旧数据

    // 正则表达式在输入中匹配BV号，匹配不成功就跳出
    const bvidPattern = /(BV[a-zA-Z0-9]+)/
    const BV = searchQuery.value.match(bvidPattern)
    console.log(BV) // 查看BV的数据结构
    if (!BV) {
        console.log("BV号异常")
        loading.value = false
        return
    }
    console.log('BV号:', BV[1]) // BV的第一项是BV号

    try {
        // 发送GET请求到后端API，encodeURIComponent用于对URL参数进行编码，防止特殊字符导致URL格式错误
        const res = await fetch(`http://localhost:3000/api/bv/info?input=${encodeURIComponent(BV[1])}`)
        // 将响应体解析为JSON对象
        const data = await res.json()
        
        if (data.error) {
            message.value = data.error
            console.log('测试点1，请求已送达后端，但后端返回错误信息')
        } 
        else {
            videoInfo.value = data   // 请求成功，保存视频信息到响应式变量
            console.log('测试点2，请求已送达后端，无错误信息')
        }
    } 
    catch (e) {
        message.value = '解析失败，请检查后端服务'
        console.log('测试点3，后端连接异常或JSON解析失败')
    } 
    finally {
        // 无论成功或失败，都将loading设为false以恢复按钮状态
        loading.value = false
    }
    // 监看下后端信息和视频信息
    console.log('message:', message.value)
    console.log('videoInfo:', videoInfo.value)

    // 解析成功后，路由到message并传递视频信息
    if (videoInfo.value) {
        videoStore.setVideoInfo(videoInfo.value)
        router.push({ path: '/message' })
    }
};
</script>


<template>
    <div class="search-container">
        <h1 class="title">B站视频下载器</h1>
        <div class="search-box">
            <input
                v-model="searchQuery"
                type="text"
                class="search-input"
                placeholder="请输入BV号或视频链接"
                @keyup.enter="handleSearch"
                />
            <button 
                class="search-btn" 
                :disabled="loading" 
                @click="handleSearch"
                >
                {{ loading ? '正在解析' : '解析视频' }}
            </button>
        </div>
    </div>
</template>


<style scoped>
.search-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    height: 40vh;
}

.title {
    /* 天依蓝 */
    color: #66CCFF;
}

.search-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: 700px;
    height: 50px;
    border-radius: 25px;
    border: 2px solid transparent;
    background: white;
    position: relative;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    overflow: hidden;
}

.search-box::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px; background: linear-gradi
    ent(90deg, #3370FF 0%, #9D4EDD 100%);
    z-index: -1;
    border-radius: 27px;
}

.search-input {
    flex: 0.985;
    height: 100%;
    border: none;
    outline: none;
    padding: 0 20px;
    font-size: 16px;
    background: transparent;
}

.search-btn {
    background: linear-gradient(90deg, #3370FF 0%, #9D4EDD 100%);
    color: white;
    border: none;
    border-radius: 20px;
    padding: 10px 20px;
    font-size: 15px;    /* 按钮字体不宜过大，不然会向下偏 */
    cursor: pointer;
    transition: opacity 0.2s ease;
    min-width: 120px;
    height: 40px;
}

.search-btn:hover {
    /* 鼠标放上去会白一点 */
    opacity: 0.9;
}
</style>