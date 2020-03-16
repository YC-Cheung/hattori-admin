<template>
  <div class="app-container">
    <div class="block">
      <el-row>
        <el-col :span="24">
          <el-button v-perm="'create_menu'" type="success" size="mini" icon="el-icon-plus" @click="handleCreate">创建</el-button>
          <el-button v-perm="'update_menu'" type="primary" size="mini" icon="el-icon-edit" @click="handleUpdate">编辑</el-button>
          <el-button v-perm="'delete_menu'" type="danger" size="mini" icon="el-icon-delete" @click="handleDelete">删除</el-button>
          <el-button v-perm="'update_menu_roles'" type="primary" size="mini" icon="el-icon-s-custom" @click="handleUpdateMenuRoles">菜单角色分配</el-button>
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
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="path" label="url" />
      <el-table-column prop="component" label="组件" />
    </el-table>
    <pagination :page="page" />
    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible" width="30%">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="right" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="temp.name" />
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="temp.title" />
        </el-form-item>
        <el-form-item label="url" prop="path">
          <el-input v-model="temp.path" />
        </el-form-item>
        <el-form-item label="组件" prop="component">
          <el-input v-model="temp.component" />
        </el-form-item>
        <el-form-item label="是否显示" prop="is_show">
          <el-switch v-model="temp.is_show" />
        </el-form-item>
        <el-form-item label="是否缓存" prop="is_cache">
          <el-switch v-model="temp.is_cache" />
        </el-form-item>
        <el-form-item label="父级菜单" prop="parent">
          <el-select v-model="temp.parent" clearable placeholder="无">
            <el-option v-for="o in filterParentMenuOptions" :key="o.id" :label="o.title" :value="o.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button v-if="dialogStatus=='create'" type="primary" @click="createData">创建</el-button>
        <el-button v-else type="primary" @click="updateData">确定</el-button>
      </div>
    </el-dialog>
    <!--弹出窗口 分配权限-->
    <el-dialog title="菜单角色分配" :visible.sync="editRolesDialogVisible" width="40%">
      <div>
        <el-checkbox v-model="checkRolesAll" :indeterminate="isRolesIndeterminate" @change="handlecheckRolesAllChange">全选</el-checkbox>
        <div style="margin: 15px 0;">
          <el-checkbox-group v-model="updateMenuRolesData.roleIds" @change="handleCheckedRolesChange">
            <el-checkbox v-for="role in roleOptions" :key="role.id" class="role-checkbox" :label="role.id">
              {{ role.name }}
            </el-checkbox>
          </el-checkbox-group>
        </div>
        <div slot="footer" class="dialog-footer">
          <el-button @click="editRolesDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="checkupdateMenuRolesData">确定</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import Pagination from '@/components/Hattori/Pagination'
import { getMenus, createMenu, updateMenu, deleteMenu, setMenuRoles, getMenuOptions } from '@/api/menu'
import { getRoleOptions } from '@/api/role'
import { resetTemp } from '@/utils'

export default {
  name: 'SystemMenu',
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
      updateMenuRolesData: {
        id: null,
        permIds: []
      },
      temp: {
        id: null,
        parent: null,
        name: null,
        title: null,
        icon: null,
        component: null,
        path: null,
        is_cache: null,
        is_show: null
      },
      textMap: {
        update: '编辑权限',
        create: '新增权限'
      },
      roleOptions: [],
      methodOptions: [],
      parentMenuOptions: [],
      // filterParentMenuOptions: [],
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
  computed: {
    filterParentMenuOptions: function() {
      if (this.dialogStatus === 'update') {
        return this.parentMenuOptions.filter(i => i.id !== this.temp.id)
      } else {
        return this.parentMenuOptions
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
      this.initMenuOptions()
      this.initRoleOptions()
    },
    async initMenuOptions() {
      const [err, data] = await this.$to(getMenuOptions())
      if (err) return
      data.data.forEach(obj => {
        if (!obj.parent) {
          this.parentMenuOptions.push(obj)
        }
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
      const { data } = await getMenus(query)
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
        createMenu(this.temp).then(res => {
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
        updateMenu(updateId, updateData).then(res => {
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
          deleteMenu(this.selRow.id).then(res => {
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
    handleUpdateMenuRoles() {
      if (!this.checkSel()) return
      this.updateMenuRolesData = {
        id: this.selRow.id,
        roleIds: this.selRow.roles.map(role => role.id)
      }
      this.editRolesDialogVisible = true
    },
    getUpdateData(temp) {
      const tempData = Object.assign({}, temp)
      const updateId = tempData.id
      const updateData = {
        parent: tempData.parent,
        name: tempData.name,
        title: tempData.title,
        icon: tempData.icon,
        component: tempData.component,
        path: tempData.path,
        is_show: tempData.is_show,
        is_cache: tempData.is_cache
      }

      return { updateId, updateData }
    },
    handlecheckRolesAllChange(val) {
      const allRoleIds = this.roleOptions.map(role => role.id)
      this.updateMenuRolesData.roleIds = val ? allRoleIds : []
      this.isRolesIndeterminate = false
    },
    handleCheckedRolesChange(value) {
      const checkedCount = value.length
      this.checkRolesAll = checkedCount === this.roleOptions.length
      this.isRolesIndeterminate = checkedCount > 0 && checkedCount < this.roleOptions.length
    },
    checkupdateMenuRolesData() {
      const noRolesSelected = this.updateMenuRolesData && this.updateMenuRolesData.roleIds && this.updateMenuRolesData.roleIds.length === 0
      if (noRolesSelected) {
        this.$confirm('当前没有选中任何角色，该菜单会从已分配的角色中移除, 是否继续?', '提示', confirm).then(() => {
          this.invokeUpdateMenuRolesApi()
        }).catch(() => {
          this.$message('已取消分配菜单给角色')
        })
      } else {
        this.invokeUpdateMenuRolesApi()
      }
    },
    async invokeUpdateMenuRolesApi() {
      const { id, roleIds } = this.updateMenuRolesData
      const [err] = await this.$to(setMenuRoles(id, { roles: roleIds }))
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
