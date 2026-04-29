<script setup lang="ts">
    import { ref, onMounted, onUnmounted } from 'vue'
    import { useRouter } from 'vue-router'
    import { useUserStore } from '@/stores/user'

    const router = useRouter()
    const userStore = useUserStore()

    const qrCodeUrl = ref('')
    const qrCodeImg = ref('')
    const qrcodeKey = ref('')
    const statusText = ref('请使用B站App扫码登录')
    const isExpired = ref(false)
    let pollTimer: number | null = null

    async function getQrCode() {
        try {
            const res = await fetch('http://localhost:3000/api/login/qrcode')
            const data = await res.json()
            qrCodeUrl.value = data.url
            qrcodeKey.value = data.qrcode_key
            qrCodeImg.value = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.url)}`
            isExpired.value = false
            statusText.value = '请使用B站App扫码登录'
            startPolling()
        } catch (error) {
            console.error('获取二维码失败:', error)
            statusText.value = '获取二维码失败，请刷新重试'
        }
    }

    function startPolling() {
        stopPolling()
        pollTimer = window.setInterval(async () => {
            try {
                const res = await fetch(`http://localhost:3000/api/login/check?qrcode_key=${qrcodeKey.value}`)
                const data = await res.json()
                
                if (data.status === 'success') {
                    stopPolling()
                    await getUserInfo(data.sessdata, data.bili_jct, data.dede_user_id)
                } else if (data.status === 'expired') {
                    stopPolling()
                    isExpired.value = true
                    statusText.value = '二维码已过期，请点击刷新'
                } else if (data.status === 'waiting_scan') {
                    statusText.value = '请使用B站App扫码登录'
                } else if (data.status === 'waiting_confirm') {
                    statusText.value = '请在手机上确认登录'
                }
            } catch (error) {
                console.error('检查登录状态失败:', error)
            }
        }, 2000)
    }

    function stopPolling() {
        if (pollTimer) {
            clearInterval(pollTimer)
            pollTimer = null
        }
    }

    async function getUserInfo(sessdata: string, biliJct: string, dedeUserId: string) {
        try {
            const params = new URLSearchParams({
                sessdata,
                bili_jct: biliJct || '',
                dede_user_id: dedeUserId || ''
            })
            const res = await fetch(`http://localhost:3000/api/user/info?${params}`)
            const data = await res.json()
            
            if (data.username) {
                userStore.setUserInfo(data.username, sessdata, biliJct, dedeUserId)
                statusText.value = '登录成功！'
                setTimeout(() => {
                    router.push('/')
                }, 500)
            } else {
                statusText.value = '获取用户信息失败'
            }
        } catch (error) {
            console.error('获取用户信息失败:', error)
            statusText.value = '获取用户信息失败'
        }
    }

    onMounted(() => {
        getQrCode()
    })

    onUnmounted(() => {
        stopPolling()
    })
</script>

<template>
    <div class="login-container">
        <div class="login-box">
            <h2>用B站App扫码登录</h2>
            <div class="qrcode-wrapper">
                <img v-if="qrCodeImg" :src="qrCodeImg" alt="登录二维码" class="qrcode-img">
                <div v-if="isExpired" class="qrcode-overlay" @click="getQrCode">
                    <span>二维码已过期</span>
                    <span>点击刷新</span>
                </div>
            </div>
            <p class="status-text">{{ statusText }}</p>
        </div>
    </div>
</template>

<style scoped>
    .login-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 80vh;
    }
    .login-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 30px 50px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 15px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }
    h2 {
        color: #333;
        margin-bottom: 20px;
    }
    .qrcode-wrapper {
        position: relative;
        width: 200px;
        height: 200px;
    }
    .qrcode-img {
        width: 100%;
        height: 100%;
    }
    .qrcode-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: white;
        cursor: pointer;
        border-radius: 4px;
    }
    .qrcode-overlay span {
        margin: 5px 0;
    }
    .status-text {
        margin-top: 15px;
        color: #666;
        font-size: 14px;
    }
</style>
