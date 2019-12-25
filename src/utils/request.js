import axios from 'axios'
import { Message } from 'element-ui'
import store from '@/store'
import { getToken } from '@/utils/auth'

const errorMessage = {
  400: '参数错误',
  401: '登录已失效，请重新登录',
  403: '没有权限，请联系管理员',
  404: '访问资源不存在',
  422: '参数格式不正确',
  500: '服务器发生错误，请稍后再试',
  502: '网关错误',
  503: '服务不可用，服务器暂时过载或维护',
  504: '网关超时'
}

const showError = (res) => {
  const { msg } = res.data
  Message.error(msg || errorMessage[res.status] || `服务器异常 (code: ${res.status})`)
}

// create an axios instance
const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API, // url = base url + request url
  // withCredentials: true, // send cookies when cross-domain requests
  timeout: 5000 // request timeout
})

// request interceptor
service.interceptors.request.use(
  config => {
    if (store.getters.token) {
      config.headers['Authorization'] = `Bearer ${getToken()}`
    }
    return config
  },
  error => {
    console.log(error) // for debug
    return Promise.reject(error)
  }
)

// response interceptor
service.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code !== 0) {
      showError(response)
      return
    } else {
      return res
    }
  },
  error => {
    console.log('err' + error) // for debug
    const { response: res } = error

    if (res) {
      showError(res)
      if (res.code === 4001) {
        store.dispatch('user/resetToken').then(() => {
          location.reload()
        })
      }
    } else {
      if (error instanceof axios.Cancel) {
        console.log(error.toString())
      } else {
        Message.error('请求失败')
      }
    }
  }
)

export default service
