import CatalogManager from '../components/CatalogManager'
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../api/staffCatalogApi'

const api = {
  list: listCategories,
  create: createCategory,
  update: updateCategory,
  remove: deleteCategory,
}

export default function StaffCategoriesPage() {
  return <CatalogManager title="Quản lý thể loại" noun="thể loại" api={api} />
}
