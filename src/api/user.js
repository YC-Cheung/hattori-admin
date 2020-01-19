import request from '@/utils/request'

export function getUsers(query) {
  return request({
    url: '/users/',
    method: 'get',
    params: query
  })
}

export function createUser(data) {
  return request({
    url: '/users/',
    method: 'post',
    data
  })
}

export function updateUser(id, data) {
  return request({
    url: `/users/${id}/`,
    method: 'patch',
    data
  })
}

export function deleteUser(id) {
  return request({
    url: `/users/${id}/`,
    method: 'delete'
  })
}

export function setUserRoles(id, data) {
  return request({
    url: `/users/${id}/roles/`,
    method: 'post',
    data
  })
}
