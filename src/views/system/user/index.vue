<template>
  <div class="app-container">
    <div class="block">
      <el-row>
        <el-col :span="24">
          <el-button type="success" size="mini" icon="el-icon-plus">创建</el-button>
          <el-button type="primary" size="mini" icon="el-icon-edit">编辑</el-button>
          <el-button type="danger" size="mini" icon="el-icon-delete">删除</el-button>
          <el-button type="primary" size="mini" icon="el-icon-s-custom">角色分配</el-button>
        </el-col>
      </el-row>
    </div>
    <el-table
      ref="table"
      v-loading="listLoading"
      v-el-height-adaptive-table="{table: $refs.table, bottomOffset: 75}"
      :data="list"
      border
      fit
      highlight-current-row
      height="50"
      style="width: 100%"
      @current-change="handleCurrentChange"
    >
      <el-table-column prop="id" label="用户id" />
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="name" label="昵称" />
    </el-table>
    <pagination :page="page" />
  </div>
</template>

<script>
import Pagination from '@/components/Hattori/Pagination'
import { getUsers, addUser, updateUser, deleteUser } from '@/api/user'
export default {
  name: 'SystemUser',
  components: {
    Pagination
  },
  data() {
    return {
      listLoading: false,
      page: {},
      list: [],
      selRow: {}
    }
  },
  created() {
    for (let i = 0; i < 20; i++) {
      this.list.push({
        id: 1,
        username: 'admin',
        name: '超级管理员'
      })
    }
    this.page = {
      total: 100
    }
  },
  methods: {
    handleCurrentChange(currentRow, oldCurrentRow) {
      this.selRow = currentRow
    }
  }
}
</script>

<style>

</style>
