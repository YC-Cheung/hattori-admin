import request from '@/utils/request'

export function getRoles() {
  return request({
    url: '/roles/',
    method: 'get'
  })
}

export function createRole(data) {
  return request({
    url: '/roles/',
    method: 'post',
    data
  })
}

export function updateRole(id, data) {
  return request({
    url: `/roles/${id}/`,
    method: 'patch',
    data
  })
}

export function deleteRole(id) {
  return request({
    url: `/roles/${id}/`,
    method: 'delete'
  })
}

export function getRoleOptions() {
  return request({
    url: '/roles/options/',
    method: 'get'
  })
}

export function setRolePerms(id, data) {
  return request({
    url: `/roles/${id}/perms/`,
    method: 'post',
    data
  })
}

export function setRoleMenus(id, data) {
  return request({
    url: `/roles/${id}/menus/`,
    method: 'post',
    data
  })
}
