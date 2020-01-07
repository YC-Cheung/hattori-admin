<template>
  <div class="app-container">
    <div class="block">
      <el-row>
        <el-col :span="24">
          <el-button type="success" size="mini" icon="el-icon-plus" @click="handleCreate">创建</el-button>
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
        <!-- <el-form-item label="角色" prop="roles">
          <el-select v-model="temp.roles" multiple placeholder="选择角色" filterable clearable>
            <el-option v-for="option of roleOptions" :key="option.id" :label="option.name" :value="option.id" />
          </el-select>
        </el-form-item> -->
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button v-if="dialogStatus=='create'" type="primary" @click="createData">创建</el-button>
        <el-button v-else type="primary" @click="updateData">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import Pagination from '@/components/Hattori/Pagination'
import { getUsers, addUser, updateUser, deleteUser } from '@/api/user'
import { getOptions } from '@/api/role'
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
      dialogStatus: '',
      temp: {
        idx: null,
        id: null,
        username: null,
        password: null,
        confirm_password: null,
        roles: []
      },
      textMap: {
        'update': '编辑用户',
        'create': '新增用户'
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
      async handler(newVal) {
        this.listLoading = true
        const { data } = await getUsers(newVal.query)
        this.list = data.results
        this.page = { total: data.count }
        this.listLoading = false
      },
      immediate: true
    }
  },
  created() {
    this.initData()
  },
  methods: {
    async initData() {
      const { data } = await getOptions()
      data.forEach(obj => {
        this.roleOptions.push(obj)
        this.roleMap.set(obj.id, obj.name)
      })
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
        addUser(this.temp).then((res) => {
          const { data } = res
          this.temp.id = data.id
          this.temp.roles = []
          this.list.push(Object.assign({}, this.temp))
          ++this.page.total
          this.dialogFormVisible = false
          this.$message.success('添加成功')
        })
      })
    },
    handleCurrentChange(currentRow, oldCurrentRow) {
      this.selRow = currentRow
    }
  }
}
</script>

<style>

</style>
