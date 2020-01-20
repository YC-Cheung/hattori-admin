<template>
  <div class="app-container">
    <div class="block">
      <el-row>
        <el-col :span="24">
          <el-button type="success" size="mini" icon="el-icon-plus" @click="handleCreate">创建</el-button>
          <el-button type="primary" size="mini" icon="el-icon-edit" @click="handleUpdate">编辑</el-button>
          <el-button type="danger" size="mini" icon="el-icon-delete" @click="handleDelete">删除</el-button>
          <el-button type="primary" size="mini" icon="el-icon-s-custom" @click="handleUpdateUserRoles">角色分配</el-button>
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
      height="400px"
      style="width: 100%"
      @current-change="handleCurrentChange"
    >
      <el-table-column prop="id" label="用户id" />
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="roles" label="角色">
        <template slot-scope="{row}">
          <el-tag v-for="role in row.roles" :key="role.id" style="margin: 2px;">{{ roleMap.get(role.id) }}</el-tag>
        </template>
      </el-table-column>
    </el-table>
    <pagination :page="page" />
    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible" width="30%">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="80px">
        <el-form-item v-if="dialogStatus=='create'" label="用户名" prop="username">
          <el-input v-model="temp.username" />
        </el-form-item>
        <el-form-item label="密码" prop="password" :class="{ 'is-required': passwordRequired }">
          <el-input v-model="temp.password" type="password" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirm_password" :class="{ 'is-required': passwordRequired }">
          <el-input v-model="temp.confirm_password" type="password" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button v-if="dialogStatus=='create'" type="primary" @click="createData">创建</el-button>
        <el-button v-else type="primary" @click="updateData">确定</el-button>
      </div>
    </el-dialog>
    <!--弹出窗口：修改角色权限-->
    <el-dialog title="角色分配" :visible.sync="editRolesDialogVisible" width="40%">
      <div>
        <el-checkbox v-model="checkAll" :indeterminate="isIndeterminate" @change="handleCheckRolesAllChange">全选</el-checkbox>
        <div style="margin: 15px 0;" />
        <el-checkbox-group v-model="updateUserRolesData.roleIds" @change="handleCheckedRolesChange">
          <el-checkbox v-for="role in roleOptions" :key="role.id" class="perm-checkbox" :label="role.id">
            {{ role.name }}
          </el-checkbox>
        </el-checkbox-group>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="editRolesDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="checkUpdateUserRolesData">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import Pagination from '@/components/Hattori/Pagination'
import { getUsers, createUser, updateUser, deleteUser, setUserRoles } from '@/api/user'
import { getRoleOptions } from '@/api/role'
import { resetTemp } from '@/utils'
export default {
  name: 'SystemUser',
  components: {
    Pagination
  },
  data() {
    const validateName = (rule, value, callback) => {
      if (this.dialogStatus === 'create' && !value) {
        callback(new Error('必填'))
      } else {
        callback()
      }
    }
    const validatePassword = (rule, value, callback) => {
      if (this.passwordRequired && !value) {
        callback(new Error('请输入密码'))
      } else {
        if (this.temp.password !== '') {
          this.$refs.dataForm.validateField('confirm_password')
        }
        callback()
      }
    }
    const validatePasswordConfirm = (rule, value, callback) => {
      if (this.passwordRequired && !value) {
        callback(new Error('请再次输入密码'))
      } else if (value !== this.temp.password) {
        callback(new Error('两次输入密码不一致!'))
      } else {
        callback()
      }
    }
    return {
      listLoading: false,
      page: {},
      list: [],
      selRow: {},
      roleOptions: [],
      roleMap: new Map(),
      dialogFormVisible: false,
      editRolesDialogVisible: false,
      checkAll: false,
      isIndeterminate: true,
      dialogStatus: '',
      temp: {
        id: null,
        username: null,
        password: null,
        confirm_password: null
      },
      textMap: {
        'update': '编辑用户',
        'create': '新增用户'
      },
      updateUserRolesData: {
        id: null,
        roleIds: []
      },
      rules: {
        username: [{ required: true, validator: validateName, trigger: 'blur' }],
        password: [{ required: this.dialogStatus === 'create', validator: validatePassword, trigger: 'blur' }],
        confirm_password: [{ validator: validatePasswordConfirm, trigger: 'change' }]
      }
    }
  },
  computed: {
    passwordRequired() {
      return this.dialogStatus === 'create'
    }
  },
  watch: {
    $route: {
      handler(newVal) {
        this.fetchData(newVal.query)
      },
      immediate: true
    }
  },
  created() {
    this.initData()
  },
  methods: {
    async initData() {
      const { data } = await getRoleOptions()
      data.forEach(obj => {
        this.roleOptions.push(obj)
        this.roleMap.set(obj.id, obj.name)
      })
    },
    async fetchData(query) {
      this.listLoading = true
      const { data } = await getUsers(query)
      this.list = data.results
      this.page = { total: data.count }
      this.listLoading = false
    },
    reloadData() {
      this.fetchData(this.$route.query)
    },
    handleCreate() {
      resetTemp(this.temp)
      this.dialogStatus = 'create'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    createData() {
      this.$refs['dataForm'].validate((valid) => {
        if (!valid) return
        createUser(this.temp).then((res) => {
          this.dialogFormVisible = false
          this.$message.success('添加成功')
          this.reloadData()
        })
      })
    },
    handleCurrentChange(currentRow, oldCurrentRow) {
      this.selRow = currentRow
    },
    checkSel() {
      if (this.selRow && this.selRow.id) {
        return true
      }
      this.$message.warning('请选中操作项')
      return false
    },
    handleUpdate() {
      if (this.checkSel()) {
        this.dialogStatus = 'update'
        resetTemp(this.temp)
        this.temp.id = this.selRow.id
        this.temp.username = this.selRow.username
        this.temp.password = null
        this.temp.confirm_password = null
        this.dialogFormVisible = true
        this.$nextTick(() => this.$refs['dataForm'].clearValidate())
      }
    },
    updateData() {
      this.$refs['dataForm'].validate((valid) => {
        if (!valid) return
        const { updateId, updateData } = this.getUpdateData(this.temp)
        updateUser(updateId, updateData).then(res => {
          this.dialogFormVisible = false
          this.$message.success('更新成功')
          this.reloadData()
        })
      })
    },
    getUpdateData(temp) {
      const tempData = Object.assign({}, temp)
      const updateId = tempData.id
      const updateData = {
        username: tempData.username,
        password: tempData.password,
        confirm_password: tempData.confirm_password
      }
      return { updateId, updateData }
    },
    handleDelete() {
      if (this.checkSel()) {
        if (this.selRow.id === 1 || this.selRow.username === 'admin') {
          this.$message.error('不允许删除 admin 超级管理员')
          return
        }
        this.$confirm(`您确定要永久删除该用户 ${this.selRow.username} ？`, '提示', confirm).then(() => {
          deleteUser(this.selRow.id).then(res => {
            this.dialogFormVisible = false
            this.$message.success('删除成功')
            this.reloadData()
          })
        }).catch(() => {
          this.$message.info('已取消删除')
        })
      }
    },
    handleUpdateUserRoles() {
      if (this.checkSel()) {
        this.updateUserRolesData.id = this.selRow.id
        this.updateUserRolesData.roleIds = this.selRow.roles.map(role => role.id)
        this.editRolesDialogVisible = true
      }
    },
    handleCheckRolesAllChange(value) {
      const allRoleIds = this.roleOptions.map(role => role.id)
      this.updateUserRolesData.roleIds = value ? allRoleIds : []
      this.isIndeterminate = false
    },
    handleCheckedRolesChange(value) {
      const checkedCount = value.length
      this.checkAll = checkedCount === this.roleOptions.length
      this.isIndeterminate = checkedCount > 0 && checkedCount < this.roleOptions.length
    },
    checkUpdateUserRolesData() {
      const noRolesSelected = this.updateUserRolesData && this.updateUserRolesData.roleIds && this.updateUserRolesData.roleIds.length === 0
      if (noRolesSelected) {
        this.$confirm('当前没有选中任何角色，会清除该用户已有的, 是否继续?', '提示', confirm).then(() => {
          this.invokeSetUserRolesApi()
        }).catch(() => {
          this.$message('已取消用户角色分配')
        })
      } else {
        this.invokeSetUserRolesApi()
      }
    },
    async invokeSetUserRolesApi() {
      const { id, roleIds } = this.updateUserRolesData
      const [err] = await this.$to(setUserRoles(id, { roles: roleIds }))
      this.editRolesDialogVisible = false
      if (err) return
      this.$message.success('角色分配成功')
      this.reloadData()
    }
  }
}
</script>

<style>

</style>
