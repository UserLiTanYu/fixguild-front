import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue'
import { errorMessage, type PageQuery, type PageResult } from './api'

export function usePagedList<T, Filters extends object>(fetchPage: (query: PageQuery & Filters) => Promise<PageResult<T>>) {
  const records = shallowRef<T[]>([])
  const pageNum = ref(1)
  const pageSize = ref(20)
  const total = ref(0)
  const loading = ref(true)
  const error = ref('')
  const lastPage = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
  let filters = {} as Filters
  let requestNumber = 0

  async function load() {
    const current = ++requestNumber
    loading.value = true
    error.value = ''
    try {
      const result = await fetchPage({ ...filters, pageNum: pageNum.value, pageSize: pageSize.value })
      if (current !== requestNumber) return
      total.value = result.total
      if (pageNum.value > lastPage.value) {
        pageNum.value = lastPage.value
        await load()
        return
      }
      records.value = result.records
    } catch (problem) {
      if (current === requestNumber) error.value = errorMessage(problem)
    } finally {
      if (current === requestNumber) loading.value = false
    }
  }

  function goTo(page: number) {
    pageNum.value = page
    return load()
  }

  function setSize(size: number) {
    pageSize.value = size
    return goTo(1)
  }

  function search(next: Filters) {
    filters = next
    return goTo(1)
  }

  onMounted(load)
  onUnmounted(() => { requestNumber++ })
  return { records, pageNum, pageSize, lastPage, total, loading, error, load, goTo, setSize, search }
}
