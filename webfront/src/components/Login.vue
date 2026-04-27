<script setup lang="ts">
    import { useRouter } from 'vue-router';
    const router = useRouter();
    
    function LoginBili() {
        router.push('/login')
    }
    
</script>

<template>
    <el-button type="primary" link class="login-btn" @click="LoginBili"> 登录 </el-button>
</template>

<style scoped>
    .login-btn {
        position: absolute;
        top: 0;
        right: 0;
        height: 50px;
        right: 5vw;
    }
</style>
