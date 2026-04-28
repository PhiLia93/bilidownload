import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
    const username = ref('')
    const sessdata = ref('')
    
    const isLoggedIn = computed(() => !!sessdata.value)

    function setUserInfo(name: string, sess: string) {
        username.value = name
        sessdata.value = sess
    }

    function logout() {
        username.value = ''
        sessdata.value = ''
    }

    return {
        username,
        sessdata,
        isLoggedIn,
        setUserInfo,
        logout
    }
})
