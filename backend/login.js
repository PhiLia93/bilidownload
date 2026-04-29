import Router from 'koa-router'
import axios from 'axios'

const router = new Router()

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.bilibili.com',
    'Accept': '*/*'
}

router.get('/api/login/qrcode', async (ctx) => {
    try {
        const res = await axios.get(
            'https://passport.bilibili.com/x/passport-login/web/qrcode/generate',
            { headers }
        )
        ctx.body = {
            url: res.data.data.url,
            qrcode_key: res.data.data.qrcode_key
        }
    } catch (error) {
        console.error('获取二维码失败:', error.message)
        ctx.status = 500
        ctx.body = { error: '获取二维码失败' }
    }
})

router.get('/api/login/check', async (ctx) => {
    const { qrcode_key } = ctx.query
    
    if (!qrcode_key) {
        ctx.status = 400
        ctx.body = { error: '缺少qrcode_key' }
        return
    }

    try {
        const res = await axios.get(
            `https://passport.bilibili.com/x/passport-login/web/qrcode/poll?qrcode_key=${qrcode_key}`,
            { headers }
        )
        
        console.log('登录检查响应:', JSON.stringify(res.data, null, 2))
        
        const { code, data } = res.data
        
        if (code === 0 && data.code === 0) {
            let sessdata = ''
            let biliJct = ''
            let dedeUserId = ''
            
            if (data.url) {
                const urlObj = new URL(data.url)
                sessdata = urlObj.searchParams.get('SESSDATA') || ''
                biliJct = urlObj.searchParams.get('bili_jct') || ''
                dedeUserId = urlObj.searchParams.get('DedeUserID') || ''
            }
            
            console.log('获取到的SESSDATA:', sessdata)
            
            ctx.body = {
                status: 'success',
                sessdata: sessdata,
                bili_jct: biliJct,
                dede_user_id: dedeUserId,
                url: data.url
            }
        } else if (code === 0 && data.code === 86038) {
            ctx.body = { status: 'expired' }
        } else if (code === 0 && data.code === 86090) {
            ctx.body = { status: 'waiting_scan' }
        } else if (code === 0 && data.code === 86101) {
            ctx.body = { status: 'waiting_confirm' }
        } else {
            ctx.body = { status: 'waiting', code: data.code }
        }
    } catch (error) {
        console.error('检查登录状态失败:', error.message)
        ctx.status = 500
        ctx.body = { error: '检查登录状态失败' }
    }
})

router.get('/api/user/info', async (ctx) => {
    const { sessdata, bili_jct, dede_user_id } = ctx.query
    
    if (!sessdata) {
        ctx.status = 400
        ctx.body = { error: '缺少sessdata' }
        return
    }

    console.log('获取用户信息，SESSDATA:', sessdata)

    const cookieStr = `SESSDATA=${sessdata}; bili_jct=${bili_jct || ''}; DedeUserID=${dede_user_id || ''}`

    try {
        const res = await axios.get(
            'https://api.bilibili.com/x/web-interface/nav',
            {
                headers: {
                    ...headers,
                    'Cookie': cookieStr
                }
            }
        )
        
        console.log('用户信息响应:', JSON.stringify(res.data, null, 2))
        
        if (res.data.code === 0) {
            ctx.body = {
                username: res.data.data.uname,
                face: res.data.data.face,
                mid: res.data.data.mid
            }
        } else {
            ctx.status = 401
            ctx.body = { error: '获取用户信息失败，请重新登录', code: res.data.code, message: res.data.message }
        }
    } catch (error) {
        console.error('获取用户信息失败:', error.message)
        ctx.status = 500
        ctx.body = { error: '获取用户信息失败' }
    }
})

export default router
