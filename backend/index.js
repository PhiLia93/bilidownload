import Koa from 'koa'
import Router from 'koa-router'
import cors from '@koa/cors'
import bodyParser from 'koa-bodyparser'
import axios from 'axios'
import crypto from 'crypto'
import loginRouter from './login.js'

const app = new Koa()
const router = new Router()

app.use(cors())
app.use(bodyParser())

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.bilibili.com',
    'Accept': '*/*'
}

const mixinKeyEncTab = [
    46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
    33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
    61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
    36, 20, 34, 44, 52
]

function getMixinKey(orig) {
    return mixinKeyEncTab.map(k => orig[k]).join('').slice(0, 32)
}

function encWbi(params, imgKey, subKey) {
    const mixinKey = getMixinKey(imgKey + subKey)
    const currTime = Math.round(Date.now() / 1000)
    const newParams = { ...params, wts: currTime }
    const keys = Object.keys(newParams).sort()
    const query = keys.map(k => {
        const value = String(newParams[k]).replace(/[!'()*]/g, '')
        return `${encodeURIComponent(k)}=${encodeURIComponent(value)}`
    }).join('&')
    const wRid = crypto.createHash('md5').update(query + mixinKey).digest('hex')
    return { ...newParams, w_rid: wRid }
}

let wbiKeys = { imgKey: '', subKey: '', updateTime: 0, hasCookie: false }

async function getWbiKeys(cookie = '') {
    const now = Date.now()
    const hasCookie = !!cookie
    if (wbiKeys.imgKey && now - wbiKeys.updateTime < 10 * 60 * 1000 && wbiKeys.hasCookie === hasCookie) {
        return wbiKeys
    }
    try {
        const reqHeaders = { ...headers }
        if (cookie) {
            reqHeaders['Cookie'] = cookie
        }
        const res = await axios.get('https://api.bilibili.com/x/web-interface/nav', { headers: reqHeaders })
        const { img_url, sub_url } = res.data.data.wbi_img
        wbiKeys.imgKey = img_url.split('/').pop().split('.')[0]
        wbiKeys.subKey = sub_url.split('/').pop().split('.')[0]
        wbiKeys.updateTime = now
        wbiKeys.hasCookie = hasCookie
        console.log('更新Wbi密钥:', wbiKeys)
        return wbiKeys
    } catch (e) {
        console.error('获取Wbi密钥失败:', e.message)
        return wbiKeys
    }
}

router.get('/api/bv/info', async (ctx) => {
    console.log('ctx.query: ', ctx.query)
    const { input, sessdata, bili_jct, dede_user_id } = ctx.query
    
    if (!input) { 
        ctx.status = 400 
        ctx.body = { error: '请输入有效的BV号或链接' }
        return 
    }

    const requestHeaders = { ...headers }
    if (sessdata) {
        console.log('收到sessdata，设置Cookie')
        requestHeaders['Cookie'] = `SESSDATA=${sessdata}; bili_jct=${bili_jct || ''}; DedeUserID=${dede_user_id || ''}`
        console.log('Cookie:', requestHeaders['Cookie'])
    } else {
        console.log('未收到sessdata，使用游客模式')
    }

    try {
        const res_formBili = await axios.get(
            `https://api.bilibili.com/x/web-interface/view?bvid=${input}`,
            { headers: requestHeaders }
        )

        const bvid = res_formBili.data.data.bvid
        const cid = res_formBili.data.data.cid
        
        console.log('视频标题:', res_formBili.data.data.title)
        console.log('视频cid:', cid)

        const { imgKey, subKey } = await getWbiKeys(requestHeaders['Cookie'] || '')
        const params = encWbi({
            bvid,
            cid,
            qn: 127,
            fnver: 0,
            fnval: 4048,
            fourk: 1
        }, imgKey, subKey)
        
        const queryString = Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&')
        
        const playUrlRes = await axios.get(
            `https://api.bilibili.com/x/player/wbi/playurl?${queryString}`,
            { headers: requestHeaders }
        )
        
        console.log('accept_quality:', playUrlRes.data.data.accept_quality)
        console.log('accept_description:', playUrlRes.data.data.accept_description)

        ctx.body = {
            bvid:     res_formBili.data.data.bvid,
            cid:      res_formBili.data.data.cid,
            title:    res_formBili.data.data.title,
            pic:      res_formBili.data.data.pic,
            duration: res_formBili.data.data.duration,
            author:   res_formBili.data.data.owner.name,
            quality:     playUrlRes.data.data.accept_quality,
            description: playUrlRes.data.data.accept_description,
        }
        console.log('ctx.body: ', ctx.body) 
    } 
    catch (error) {
        console.error('获取视频信息失败:', error.message) 
        ctx.status = 500
        ctx.body = { error: '获取视频信息失败：' + error.message } 
    }
})

router.get('/api/bv/download', async (ctx) => {
    const { bvid, cid, qn, title, sessdata, bili_jct, dede_user_id } = ctx.query
    
    if (!bvid || !cid || !qn) {
        ctx.status = 400
        ctx.body = { error: '缺少必要参数(bvid, cid, qn)' }
        return
    }

    const requestHeaders = { ...headers }
    if (sessdata) {
        requestHeaders['Cookie'] = `SESSDATA=${sessdata}; bili_jct=${bili_jct || ''}; DedeUserID=${dede_user_id || ''}`
    }

    try {
        console.log('下载请求参数:', { bvid, cid, qn, sessdata: sessdata ? '有' : '无' })
        
        const { imgKey, subKey } = await getWbiKeys(requestHeaders['Cookie'] || '')
        const params = encWbi({
            bvid,
            cid,
            qn,
            fnver: 0,
            fnval: 4048,
            fourk: 1
        }, imgKey, subKey)
        
        const queryString = Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&')
        
        const playUrlRes = await axios.get(
            `https://api.bilibili.com/x/player/wbi/playurl?${queryString}`,
            { headers: requestHeaders }
        )
        
        console.log('下载响应code:', playUrlRes.data.code)
        
        if (playUrlRes.data.code !== 0) {
            ctx.status = 500
            ctx.body = { error: playUrlRes.data.message || '获取视频失败' }
            return
        }
        
        const data = playUrlRes.data.data
        let videoUrl = null
        
        if (data.durl && data.durl.length > 0) {
            videoUrl = data.durl[0].url
            console.log('传统格式下载')
        } else if (data.dash && data.dash.video && data.dash.video.length > 0) {
            const qnNum = parseInt(qn)
            let videoItem = data.dash.video.find(v => v.id === qnNum)
            
            if (!videoItem) {
                for (const q of [120, 112, 80, 74, 64, 32, 16]) {
                    videoItem = data.dash.video.find(v => v.id === q)
                    if (videoItem) break
                }
            }
            
            if (videoItem) {
                videoUrl = videoItem.baseUrl || videoItem.base_url
                console.log('DASH格式下载 - 视频ID:', videoItem.id)
            }
        }
        
        if (!videoUrl) {
            ctx.status = 500
            ctx.body = { error: '无法获取视频下载地址' }
            return
        }

        ctx.set('Content-Type', 'video/mp4')
        ctx.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(title || 'video')}.mp4`)

        const videoRes = await axios.get(videoUrl, {
            headers: {
                'User-Agent': headers['User-Agent'],
                'Referer': 'https://www.bilibili.com'
            },
            responseType: 'stream'
        })
        
        ctx.body = videoRes.data
    } catch (error) {
        console.error('下载视频失败:', error.message)
        ctx.status = 500
        ctx.body = { error: '下载视频失败：' + error.message }
    }
})

app.use(router.routes())
app.use(router.allowedMethods())
app.use(loginRouter.routes())
app.use(loginRouter.allowedMethods())

app.listen(3000, () => {
    console.log('b站视频流请求服务已启动')
})
