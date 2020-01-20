<template>
  <div class="app-container">
    <div class="block">
      <el-row>
        <el-col :span="24">
          <el-button type="success" size="mini" icon="el-icon-plus" @click="handleCreate">创建</el-button>
          <el-button type="primary" size="mini" icon="el-icon-edit" @click="handleUpdate">编辑</el-button>
          <el-button type="danger" size="mini" icon="el-icon-delete" @click="handleDelete">删除</el-button>
          <el-button type="primary" size="mini" icon="el-icon-s-custom" @click="handleUpdatePermRoles">权限角色分配</el-button>
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
      <el-table-column prop="id" label="ID" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="slug" label="标识" />
      <el-table-column prop="method" label="请求方法">
        <template slot-scope="{row}">
          <el-tag :type="row.method | methodTagFilter">{{ methodMap.get(row.method) }}</el-tag>
        </template>
      </el-table-column>
    </el-table>
    <pagination :page="page" />
    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible" width="30%">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="right" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="temp.name" />
        </el-form-item>
        <el-form-item label="标识" prop="slug">
          <el-input v-model="temp.slug" />
        </el-form-item>
        <el-form-item label="描述" prop="desc">
          <el-input v-model="temp.desc" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="请求方法" prop="method">
          <el-select v-model="temp.method" clearable placeholder="选择请求方法">
            <el-option v-for="m in methodOptions" :key="m.k" :label="m.v" :value="m.k" />
          </el-select>
        </el-form-item>
        <el-form-item label="url正则" prop="path">
          <el-input v-model="temp.path" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button v-if="dialogStatus=='create'" type="primary" @click="createData">创建</el-button>
        <el-button v-else type="primary" @click="updateData">确定</el-button>
      </div>
    </el-dialog>
    <!--弹出窗口 分配权限-->
    <el-dialog title="权限分配" :visible.sync="editRolesDialogVisible" width="40%">
      <div>
        <el-checkbox v-model="checkRolesAll" :indeterminate="isRolesIndeterminate" @change="handlecheckRolesAllChange">全选</el-checkbox>
        <div style="margin: 15px 0;">
          <el-checkbox-group v-model="updatePermRolesData.roleIds" @change="handleCheckedRolesChange">
            <el-checkbox v-for="role in roleOptions" :key="role.id" class="role-checkbox" :label="role.id">
              {{ role.name }}
            </el-checkbox>
          </el-checkbox-group>
        </div>
        <div slot="footer" class="dialog-footer">
          <el-button @click="editRolesDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="checkUpdatePermRolesData">确定</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import Pagination from '@/components/Hattori/Pagination'
import { getPerms, createPerm, updatePerm, deletePerm, setPermRoles } from '@/api/perm'
import { getRoleOptions } from '@/api/role'
import { resetTemp } from '@/utils'

export default {
  name: 'SystemPerm',
  components: {
    Pagination
  },
  filters: {
    methodTagFilter(value) {
      const methodTags = {
        'delete': 'danger',
        'patch': 'warning',
        'post': 'success',
        '*': 'info'
      }
      return methodTags[value] || ''
    }
  },
  data() {
    return {
      list: [],
      selRow: {},
      page: {},
      listLoading: false,
      dialogFormVisible: false,
      editRolesDialogVisible: false,
      checkRolesAll: false,
      isRolesIndeterminate: true,
      dialogStatus: '',
      updatePermRolesData: {
        id: null,
        permIds: []
      },
      temp: {
        id: null,
        slug: null,
        name: null,
        method: null,
        path: null,
        desc: null
      },
      textMap: {
        update: '编辑权限',
        create: '新增权限'
      },
      roleOptions: [],
      methodOptions: [],
      roleMap: new Map(),
      methodMap: new Map(),
      rules: {
        name: [{ required: true, message: '请输入权限名称', trigger: 'blur' }],
        slug: [{ required: true, message: '请输入唯一标识', trigger: 'blur' }],
        method: [{ required: true, message: '请选择请求方法', trigger: 'change' }],
        path: [{ required: true, message: '请输入url正则', trigger: 'blur' }]
      }
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
    initData() {
      this.initMethodOptions()
      this.initRoleOptions()
    },
    initMethodOptions() {
      const methods = [
        { k: '*', v: 'ANY' },
        { k: 'get', v: 'GET' },
        { k: 'post', v: 'POST' },
        { k: 'put', v: 'PUT' },
        { k: 'patch', v: 'PATCH' },
        { k: 'options', v: 'OPTIONS' },
        { k: 'head', v: 'HEAD' },
        { k: 'delete', v: 'DELETE' }
      ]
      methods.forEach(obj => {
        this.methodOptions.push(obj)
        this.methodMap.set(obj.k, obj.v)
      })
    },
    async initRoleOptions() {
      const [err, data] = await this.$to(getRoleOptions())
      if (err) return
      data.data.forEach(obj => {
        this.roleOptions.push(obj)
        this.roleMap.set(obj.id, obj.name)
      })
    },
    async fetchData(query) {
      this.listLoading = true
      const { data } = await getPerms(query)
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
        createPerm(this.temp).then(res => {
          this.dialogFormVisible = false
          this.$message.success('添加成功')
          this.reloadData()
        }).catch(err => {
          console.log(err)
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
        this.temp = Object.assign({}, this.selRow)
        this.dialogStatus = 'update'
        this.dialogFormVisible = true
        this.$nextTick(() => this.$refs['dataForm'].clearValidate())
      }
    },
    updateData() {
      this.$refs['dataForm'].validate((valid) => {
        if (!valid) return
        const { updateId, updateData } = this.getUpdateData(this.temp)
        updatePerm(updateId, updateData).then(res => {
          this.dialogFormVisible = false
          this.$message.success('更新成功')
          this.reloadData()
        }).catch(err => {
          console.log(err)
        })
      })
    },
    handleDelete() {
      if (this.checkSel()) {
        this.$confirm(`您确定要永久删除该权限 ${this.selRow.name} ？`, '提示', confirm).then(() => {
          deletePerm(this.selRow.id).then(res => {
            this.dialogFormVisible = false
            this.$message.success('删除成功')
            this.reloadData()
          }).catch(err => {
            console.log(err)
          })
        }).catch(() => {
          this.$message.info('已取消删除')
        })
      }
    },
    handleUpdatePermRoles() {
      if (!this.checkSel()) return
      this.updatePermRolesData = {
        id: this.selRow.id,
        roleIds: this.selRow.roles.map(role => role.id)
      }
      this.editRolesDialogVisible = true
    },
    getUpdateData(temp) {
      const tempData = Object.assign({}, temp)
      const updateId = tempData.id
      const updateData = {
        name: tempData.name,
        slug: tempData.slug,
        method: tempData.method,
        path: tempData.path,
        desc: tempData.desc
      }

      return { updateId, updateData }
    },
    handlecheckRolesAllChange(val) {
      const allRoleIds = this.roleOptions.map(role => role.id)
      this.updatePermRolesData.roleIds = val ? allRoleIds : []
      this.isRolesIndeterminate = false
    },
    handleCheckedRolesChange(value) {
      const checkedCount = value.length
      this.checkRolesAll = checkedCount === this.roleOptions.length
      this.isRolesIndeterminate = checkedCount > 0 && checkedCount < this.roleOptions.length
    },
    checkUpdatePermRolesData() {
      const noRolesSelected = this.updatePermRolesData && this.updatePermRolesData.roleIds && this.updatePermRolesData.roleIds.length === 0
      if (noRolesSelected) {
        this.$confirm('当前没有选中任何角色，该权限会从所分配的角色中移除, 是否继续?', '提示', confirm).then(() => {
          this.invokeUpdatePermRolesApi()
        }).catch(() => {
          this.$message('已取消分配权限给角色')
        })
      } else {
        this.invokeUpdatePermRolesApi()
      }
    },
    async invokeUpdatePermRolesApi() {
      const { id, roleIds } = this.updatePermRolesData
      const [err] = await this.$to(setPermRoles(id, { roles: roleIds }))
      if (err) return
      this.editRolesDialogVisible = false
      this.$message.success('分配成功')
      this.reloadData()
    }
  }
}
</script>

<style scoped>
/* .el-select {
  width: 100%;
} */
</style>>
