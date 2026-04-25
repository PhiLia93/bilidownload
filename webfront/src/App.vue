<script setup lang="ts">
    import { RouterView } from 'vue-router';
    import Login from '@/components/Login.vue';
</script>

<template>
    <div class="container">
        <Login />
        <RouterView />
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
</style>
