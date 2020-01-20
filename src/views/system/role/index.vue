<template>
  <div class="app-container">
    <div class="block">
      <el-row>
        <el-col :span="24">
          <el-button type="success" size="mini" icon="el-icon-plus" @click="handleCreate">创建</el-button>
          <el-button type="primary" size="mini" icon="el-icon-edit" @click="handleUpdate">编辑</el-button>
          <el-button type="danger" size="mini" icon="el-icon-delete" @click="handleDelete">删除</el-button>
          <el-button type="primary" size="mini" icon="el-icon-s-custom" @click="handleUpdateRolePerms">权限分配</el-button>
          <el-button type="primary" size="mini" icon="el-icon-s-custom" @click="handleUpdateRoleMenus">菜单设置</el-button>
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
      <el-table-column prop="desc" label="描述" />
    </el-table>
    <pagination :page="page" />
    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible" width="30%">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="right" label-width="50px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="temp.name" />
        </el-form-item>
        <el-form-item label="标识" prop="slug">
          <el-input v-model="temp.slug" />
        </el-form-item>
        <el-form-item label="描述" prop="desc">
          <el-input v-model="temp.desc" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button v-if="dialogStatus=='create'" type="primary" @click="createData">创建</el-button>
        <el-button v-else type="primary" @click="updateData">确定</el-button>
      </div>
    </el-dialog>
    <!--弹出窗口：修改角色权限-->
    <el-dialog title="修改角色权限" :visible.sync="editPermsDialogVisible" width="40%">
      <div>
        <el-checkbox v-model="checkPermsAll" :indeterminate="isPermsIndeterminate" @change="handlecheckPermsAllChange">全选</el-checkbox>
        <div style="margin: 15px 0;">
          <el-checkbox-group v-model="updateRolePermsData.permIds" @change="handleCheckedPermsChange">
            <el-checkbox v-for="perm in permOptions" :key="perm.id" class="perm-checkbox" :label="perm.id">
              {{ perm.name }}
            </el-checkbox>
          </el-checkbox-group>
        </div>
        <div slot="footer" class="dialog-footer">
          <el-button @click="editPermsDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="checkUpdateRolePermsData">确定</el-button>
        </div>
      </div>
    </el-dialog>
    <!--弹出窗口：角色菜单设置-->
    <el-dialog title="角色菜单设置" :visible.sync="editMenusDialogVisible" width="40%">
      <div>
        <el-checkbox v-model="checkMenusAll" :indeterminate="isMenusIndeterminate" @change="handlecheckMenusAllChange">全选</el-checkbox>
        <div style="margin: 15px 0;">
          <el-checkbox-group v-model="updateRoleMenusData.menuIds" @change="handleCheckedMenusChange">
            <el-checkbox v-for="menu in menuOptions" :key="menu.id" class="menu-checkbox" :label="menu.id">
              {{ menu.title }}
            </el-checkbox>
          </el-checkbox-group>
        </div>
        <div slot="footer" class="dialog-footer">
          <el-button @click="editMenusDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="checkUpdateRoleMenusData">确定</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import Pagination from '@/components/Hattori/Pagination'
import { getRoles, createRole, updateRole, deleteRole, setRolePerms, setRoleMenus } from '@/api/role'
import { getPermOptions } from '@/api/perm'
import { getMenuOptions } from '@/api/menu'
import { resetTemp } from '@/utils'

export default {
  name: 'SystemRole',
  components: {
    Pagination
  },
  data() {
    return {
      list: [],
      selRow: {},
      page: {},
      listLoading: false,
      dialogFormVisible: false,
      editRolesDialogVisible: false,
      editPermsDialogVisible: false,
      editMenusDialogVisible: false,
      checkPermsAll: false,
      checkMenusAll: false,
      isPermsIndeterminate: true,
      isMenusIndeterminate: true,
      dialogStatus: '',
      updateRolePermsData: {
        id: null,
        permIds: []
      },
      updateRoleMenusData: {
        id: null,
        menuIds: []
      },
      temp: {
        id: null,
        slug: null,
        name: null,
        desc: null
      },
      textMap: {
        update: '编辑角色',
        create: '新增角色'
      },
      permOptions: [],
      menuOptions: [],
      permMap: new Map(),
      menuMap: new Map(),
      rules: {
        name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
        slug: [{ required: true, message: '请输入唯一标识', trigger: 'blur' }]
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
      this.initPermOptions()
      this.initMenuOptions()
    },
    async initPermOptions() {
      const [err, data] = await this.$to(getPermOptions())
      if (err) return
      data.data.forEach(obj => {
        this.permOptions.push(obj)
        this.permMap.set(obj.id, obj.name)
      })
    },
    async initMenuOptions() {
      const [err, data] = await this.$to(getMenuOptions())
      if (err) return
      data.data.forEach(obj => {
        this.menuOptions.push(obj)
        this.menuMap.set(obj.id, obj.title)
      })
    },
    async fetchData(query) {
      this.listLoading = true
      const { data } = await getRoles(query)
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
        createRole(this.temp).then(res => {
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
        updateRole(updateId, updateData).then(res => {
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
          deleteRole(this.selRow.id).then(res => {
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
    handleUpdateRolePerms() {
      if (!this.checkSel()) return
      this.updateRolePermsData = {
        id: this.selRow.id,
        permIds: this.selRow.perms.map(perm => perm.id)
      }
      this.editPermsDialogVisible = true
    },
    getUpdateData(temp) {
      const tempData = Object.assign({}, temp)
      const updateId = tempData.id
      const updateData = {
        name: tempData.name,
        slug: tempData.slug,
        desc: tempData.desc || ''
      }

      return { updateId, updateData }
    },
    handlecheckPermsAllChange(val) {
      const allPermIds = this.permOptions.map(role => role.id)
      this.updateRolePermsData.permIds = val ? allPermIds : []
      this.isPermsIndeterminate = false
    },
    handleCheckedPermsChange(value) {
      const checkedCount = value.length
      this.checkPermsAll = checkedCount === this.permOptions.length
      this.isPermsIndeterminate = checkedCount > 0 && checkedCount < this.permOptions.length
    },
    checkUpdateRolePermsData() {
      const noPermsSelected = this.updateRolePermsData && this.updateRolePermsData.permIds && this.updateRolePermsData.permIds.length === 0
      if (noPermsSelected) {
        this.$confirm('当前没有选中任何权限，会清除该角色已有的, 是否继续?', '提示', confirm).then(() => {
          this.invokeUpdateRolePermsApi()
        }).catch(() => {
          this.$message('已取消编辑角色权限')
        })
      } else {
        this.invokeUpdateRolePermsApi()
      }
    },
    async invokeUpdateRolePermsApi() {
      const { id, permIds } = this.updateRolePermsData
      const [err] = await this.$to(setRolePerms(id, { perms: permIds }))
      if (err) return
      this.editPermsDialogVisible = false
      this.$message.success('权限分配成功')
      this.reloadData()
    },
    handleUpdateRoleMenus() {
      if (!this.checkSel()) return
      this.updateRoleMenusData = {
        id: this.selRow.id,
        menuIds: this.selRow.menus.map(menu => menu.id)
      }
      this.editMenusDialogVisible = true
    },
    getUpdateMenusData(temp) {
      const tempData = Object.assign({}, temp)
      const updateId = tempData.id
      const updateData = {
        name: tempData.name,
        slug: tempData.slug,
        desc: tempData.desc || ''
      }

      return { updateId, updateData }
    },
    handlecheckMenusAllChange(val) {
      const allMenuIds = this.menuOptions.map(menu => menu.id)
      this.updateRoleMenusData.menuIds = val ? allMenuIds : []
      this.isMenusIndeterminate = false
    },
    handleCheckedMenusChange(value) {
      const checkedCount = value.length
      this.checkMenusAll = checkedCount === this.menuOptions.length
      this.isMenusIndeterminate = checkedCount > 0 && checkedCount < this.menuOptions.length
    },
    checkUpdateRoleMenusData() {
      const noMenusSelected = this.updateRoleMenusData && this.updateRoleMenusData.menuIds && this.updateRoleMenusData.menuIds.length === 0
      if (noMenusSelected) {
        this.$confirm('当前没有选中任何菜单，会清除该角色已有的, 是否继续?', '提示', confirm).then(() => {
          this.invokeUpdateRoleMenusApi()
        }).catch(() => {
          this.$message('已取消编辑菜单设置')
        })
      } else {
        this.invokeUpdateRoleMenusApi()
      }
    },
    async invokeUpdateRoleMenusApi() {
      const { id, menuIds } = this.updateRoleMenusData
      const [err] = await this.$to(setRoleMenus(id, { menus: menuIds }))
      if (err) return
      this.editMenusDialogVisible = false
      this.$message.success('菜单设置成功')
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
