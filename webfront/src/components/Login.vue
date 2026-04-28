<script setup lang="ts">
    import { useRouter } from 'vue-router';
    import { useUserStore } from '@/stores/user';

    const router = useRouter();
    const userStore = useUserStore();
    
    function handleLoginClick() {
        if (userStore.isLoggedIn) {
            userStore.logout();
            router.push('/');
        } else {
            router.push('/login');
        }
    }
</script>

<template>
    <div class="login-header">
        <p v-if="userStore.isLoggedIn">{{ userStore.username }}</p>
        <el-button type="primary" link class="login-btn" @click="handleLoginClick">
            {{ userStore.isLoggedIn ? '登出' : '登录' }}
        </el-button>
    </div>
</template>

<style scoped>
    .login-header {
        position: absolute;
        top: 0;
        right: 5vw;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    p {
        margin-right: 9px;
        font-size: 14px;
    }
    .login-btn {
        height: 50px;
    }
</style>
