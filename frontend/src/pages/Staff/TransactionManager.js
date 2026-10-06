import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, message, Modal } from 'antd';
import axiosClient from '../utils/axiosClient';

const TransactionManager = () => {
  const [transactions, setTransactions] = useState([]);

  const fetchTransactions = async () => {
    try {
      const res = await axiosClient.get('/api/transactions/');
      setTransactions(res.data);
    } catch (error) {
      message.error('Lỗi tải danh sách phiếu mượn');
    }
  };

  useEffect(() => { fetchTransactions(); }, []);

  const handleApprove = (id) => {
    Modal.confirm({
      title: 'Xác nhận duyệt phiếu mượn?',
      onOk: async () => {
        try {
          await axiosClient.put(`/api/transactions/${id}/approve/`);
          message.success('Đã duyệt đơn, trừ sách trong kho thành công');
          fetchTransactions();
        } catch (error) {
          message.error(error.response?.data?.status === 'out_of_stock' ? 'Kho đã hết sách này!' : 'Lỗi duyệt đơn');
        }
      }
    });
  };

  const handleReturn = (record) => {
    Modal.confirm({
      title: 'Xác nhận trả sách',
      content: record.status === 'overdue' ? <span style={{color: 'red'}}>Phiếu quá hạn! Sẽ tính tiền phạt.</span> : 'Khách trả đúng hạn.',
      onOk: async () => {
        try {
          const res = await axiosClient.put(`/api/transactions/${record.id}/return/`);
          message.success(`Đã trả sách. Tiền phạt: ${res.data.fine || 0} VND`);
          fetchTransactions();
        } catch (error) {
          message.error('Lỗi hệ thống');
        }
      }
    });
  };

  const columns = [
    { title: 'Mã Phiếu', dataIndex: 'id' },
    { title: 'Độc giả', dataIndex: ['reader', 'name'] },
    { title: 'Sách', dataIndex: ['book', 'title'] },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (status) => {
        const colors = { pending: 'orange', borrowed: 'blue', returned: 'green', overdue: 'red' };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Hành động',
      render: (_, record) => (
        <Space>
          {record.status === 'pending' && <Button type="primary" onClick={() => handleApprove(record.id)}>Duyệt Đơn</Button>}
          {(record.status === 'borrowed' || record.status === 'overdue') && (
            <Button danger={record.status === 'overdue'} onClick={() => handleReturn(record)}>Xác nhận Trả</Button>
          )}
        </Space>
      )
    }
  ];

  return <Table dataSource={transactions} columns={columns} rowKey="id" />;
};
export default TransactionManager;