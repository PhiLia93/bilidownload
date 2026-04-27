import Koa from 'koa'
import Router from 'koa-router'
import cors from '@koa/cors'
import bodyParser from 'koa-bodyparser'
import axios from 'axios'

const app = new Koa()
const router = new Router()

app.use(cors())
app.use(bodyParser()) // 自动将请求体中的JSON转换为JS对象

// 通用请求头，用于模拟浏览器请求B站API
// B站会检查请求头，如果不是浏览器请求可能会返回错误
const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',  // 模拟Chrome浏览器
    'Referer': 'https://www.bilibili.com',               // 设置来源页面为B站，B站防盗链会检查这个
    'Accept': '*/*'                                      // 接受任意类型的响应
}

// 处理前端发的BV号
router.get('/api/bv/info', async (ctx) => {
    // 从URL(api/bv/info?input=xxx)查询参数(input)中获取BV号
    console.log('ctx.query: ', ctx.query)
    const { input } = ctx.query
    
    // 没成功取到BV号就报400
    if (!input) { 
        ctx.status = 400 
        ctx.body = { error: '请输入有效的BV号或链接' }
        return 
    }

    try {
        // 调用B站官方API获取视频信息
        const res_formBili = await axios.get(
            `https://api.bilibili.com/x/web-interface/view?bvid=${input}`,
            { headers }      // 使用模拟的浏览器请求头，就是最上面写的那个
        )

        const bvid = res_formBili.data.data.bvid      // BV号
        const cid = res_formBili.data.data.cid        // cid，用于后续获取播放地址

        // 获取视频清晰度列表
        const playUrlRes = await axios.get(
            `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=6&fnver=0&fnval=0`,
            { headers }
        )

        // 返回给前端的视频信息
        // ctx.body可以被多次声明，取最后一次生效，当路由函数执行完毕后，koa自动发送ctx.body给前端（JSON格式）
        ctx.body = {
            bvid:     res_formBili.data.data.bvid,                  // BV号
            cid:      res_formBili.data.data.cid,                   // cid，用于后续获取播放地址
            title:    res_formBili.data.data.title,                 // 视频标题
            pic:      res_formBili.data.data.pic,                   // 视频封面
            duration: res_formBili.data.data.duration,              // 视频时长（秒）
            author:   res_formBili.data.data.owner.name,            // 视频作者
            quality:     playUrlRes.data.data.accept_quality,       // 视频清晰度参数（qn）
            description: playUrlRes.data.data.accept_description,   // 视频清晰度描述（1080P、720P...）
            // qn是清晰度标识值，例如qn=16表示360P，64表示720P...
        }
        console.log('ctx.body: ', ctx.body) 
    } 
    catch (error) {
        console.error('获取视频信息失败:', error.message) 
        ctx.status = 500   // HTTP状态码500：服务器错误
        ctx.body = { error: '获取视频信息失败：' + error.message } 
    }
})

// 处理前端的下载请求
router.get('/api/bv/download', async (ctx) => {
    const { bvid, cid, qn, title } = ctx.query
    
    // 讲道理一般来说是不会缺的，但万一呢
    if (!bvid || !cid || !qn) {
        ctx.status = 400
        ctx.body = { error: '缺少必要参数(bvid, cid, qn)' }
        return
    }

    try {
        const playUrlRes = await axios.get(
            `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=${qn}&fnver=0&fnval=0&fourk=1`,
            { headers }
        )

        if (!playUrlRes.data.data.durl || playUrlRes.data.data.durl.length === 0) {
            ctx.status = 500
            ctx.body = { error: '无法获取视频下载地址，可能需要登录' }
            return
        }

        const videoUrl = playUrlRes.data.data.durl[0].url
        const videoSize = playUrlRes.data.data.durl[0].size

        ctx.set('Content-Type', 'video/mp4')
        ctx.set('Content-Length', videoSize)
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
app.use(router.allowedMethods())      // 自动处理允许的HTTP方法

// 启动服务器，监听3000端口
app.listen(3000, () => {
    console.log('b站视频流请求服务已启动')
})
