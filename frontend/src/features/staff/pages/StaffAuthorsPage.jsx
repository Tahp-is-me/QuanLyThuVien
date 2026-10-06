import CatalogManager from '../components/CatalogManager'
import { listAuthors, createAuthor, updateAuthor, deleteAuthor } from '../api/staffCatalogApi'

const api = { list: listAuthors, create: createAuthor, update: updateAuthor, remove: deleteAuthor }

// Backend lưu gender là số nguyên (null/0/1) nhưng chưa quy ước nghĩa.
// Tạm quy ước: 1 = Nam, 0 = Nữ - cần chốt lại với Phát.
const GENDER_LABEL = { 1: 'Nam', 0: 'Nữ' }

const extraColumns = [
  {
    key: 'gender',
    label: 'Giới tính',
    render: (a) => (a.gender === null || a.gender === undefined ? '—' : GENDER_LABEL[a.gender] ?? '—'),
  },
]

const extraFields = [
  {
    name: 'gender',
    label: 'Giới tính',
    options: [
      { value: '', label: '-- Không rõ --' },
      { value: 1, label: 'Nam' },
      { value: 0, label: 'Nữ' },
    ],
  },
]

export default function StaffAuthorsPage() {
  return (
    <CatalogManager
      title="Quản lý tác giả"
      noun="tác giả"
      api={api}
      extraColumns={extraColumns}
      extraFields={extraFields}
    />
  )
}
