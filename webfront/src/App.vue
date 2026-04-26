<script setup lang="ts">
    import { RouterView } from 'vue-router';
    import Login from '@/components/Login.vue';
</script>

<template>
    <!-- PS:踩的一个坑：所有页面、组件等等都尽量不要重名 -->
    <!-- 比如app.vue用了container，其他地方就不要再用container命名 -->
    <!-- 否则会导致样式冲突 -->
    <div class="container">
        <el-container>
            <el-header class="top-container">
                <Login />
            </el-header>
            <el-main>
                <RouterView />
            </el-main>
        </el-container>
    </div>
</template>

<style scoped>
    .container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-image: url('@/img/bg.png');
        background-size: cover;
    }
    .top-container {
        height: 5vh;
        background: linear-gradient(
            to bottom, 
            rgba(255, 255, 255, 0.7),
            rgba(255, 255, 255, 0)
        );
    }
</style>
