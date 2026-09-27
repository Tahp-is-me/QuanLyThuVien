const STATUS_MAP = {
  pending: { label: 'Chờ duyệt', className: 'badge-pending' },
  borrowed: { label: 'Đang mượn', className: 'badge-borrowed' },
  return_pending: { label: 'Chờ duyệt trả', className: 'badge-return-pending' },
  returned: { label: 'Đã trả', className: 'badge-returned' },
  overdue: { label: 'Quá hạn', className: 'badge-overdue' },
}

export default function StatusBadge({ status }) {
  const info = STATUS_MAP[status] || { label: status, className: 'badge-default' }
  return <span className={`status-badge ${info.className}`}>{info.label}</span>
}
