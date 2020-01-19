import request from '@/utils/request'

export function getMenuOptions() {
  return request({
    url: '/menus/options/',
    method: 'get'
  })
}
