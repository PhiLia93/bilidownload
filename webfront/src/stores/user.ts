import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
    const username = ref('')
    const sessdata = ref('')
    const biliJct = ref('')
    const dedeUserId = ref('')
    
    const isLoggedIn = computed(() => !!sessdata.value)

    function setUserInfo(name: string, sess: string, bjct: string, duid: string) {
        username.value = name
        sessdata.value = sess
        biliJct.value = bjct
        dedeUserId.value = duid
    }

    function logout() {
        username.value = ''
        sessdata.value = ''
        biliJct.value = ''
        dedeUserId.value = ''
    }

    return {
        username,
        sessdata,
        biliJct,
        dedeUserId,
        isLoggedIn,
        setUserInfo,
        logout
    }
})
