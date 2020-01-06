<template>
  <div :class="{'hidden':hidden}" class="pagination-container fr">
    <el-pagination
      v-if="page"
      ref="page"
      v-bind="$attrs"
      :page-sizes="pageSizes"
      :current-page.sync="currentPage"
      :page-size.sync="pageSize"
      :total="page.total"
      :layout="layout"
      background
      @size-change="onSizeChange"
      @current-change="onChange"
    />
  </div>
</template>

<script>
export default {
  name: 'Pagination',
  props: {
    page: {
      type: Object,
      required: true
    },
    layout: {
      type: String,
      default: 'total, prev, pager, next, sizes, jumper'
    },
    hidden: {
      type: Boolean,
      default: false
    },
    /**
     * 分页改变时，是否自动改变地址栏的 query string
     */
    autoPush: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      currentPage: 1,
      pageSize: 15
    }
  },
  computed: {
    pageSizes() {
      const sizes = [15, 30, 50, 100, 200]
      const pageSize = this.page.page_size
      if (pageSize && sizes.indexOf(pageSize) === -1) {
        return [this.page.page_size, ...sizes]
      } else {
        return sizes
      }
    }
  },
  watch: {
    page: {
      handler(newVal) {
        if (!newVal) {
          return
        }
        this.currentPage = newVal.current_page
        this.pageSize = newVal.page_size
        // 处理浏览器前进后退时, 分页器的当前页不对的问题
        this.$nextTick(() => {
          this.$refs.page.internalCurrentPage = newVal.current_page
        })
      },
      immediate: true
    }
  },
  methods: {
    push() {
      const query = Object.assign({}, this.$route.query, {
        page: this.currentPage,
        page_size: this.pageSize
      })
      this.$router.push({
        path: this.$route.path,
        query
      })
    },
    onSizeChange(pageSize) {
      this.$emit('size-change', pageSize)
      if (!this.autoPush) {
        return
      }
      // 切换每页数后，当前页置为 1
      this.currentPage = 1
      this.push()
    },
    onChange(page) {
      this.$emit('current-change', page)
      this.autoPush && this.push()
    }
  }
}
</script>

<style scoped>
.pagination-container {
  background: #fff;
  padding: 20px 20px;
  margin-top: 0;
}
.pagination-container.hidden {
  display: none;
}
</style>
