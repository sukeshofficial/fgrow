import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Edit2, Eye, Trash2, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import * as expenseApi from "../../api/expense.api";
import ExpenseFilterBar from "./components/ExpenseFilterBar";
import ExpenseAdvancedFilterModal from "./components/ExpenseAdvancedFilterModal";
import Sidebar from "../../components/SideBar";
import "./expenses.css";

const ExpenseList = () => {
    const navigate = useNavigate();
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [filters, setFilters] = useState({
        search: "",
        billing_status: "all",
        category: "",
        client: "",
        payment_mode: "",
        date_from: "",
        date_to: ""
    });
    const [page, setPage] = useState(1);

    const { data: response, isLoading } = useQuery({
        queryKey: ["expenses", filters, page],
        queryFn: async () => {
            const { search, billing_status, category, client, payment_mode, date_from, date_to } = filters;
            const params = {
                page,
                limit: 10,
                search: search || undefined,
                category: category || undefined,
                client: client || undefined,
                payment_mode: payment_mode || undefined,
                date_from: date_from || undefined,
                date_to: date_to || undefined,
            };
            if (billing_status && billing_status !== "all") {
                params.billing_status = billing_status;
            }
            const res = await expenseApi.listExpenses(params);
            return res.data;
        },
        keepPreviousData: true,
    });

    const expenses = response?.data || [];
    const pagination = response?.pagination || {};

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString();
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
        }).format(amount);
    };

    return (
        <>
            <Sidebar />
            <div className="finance">
                <div className="expense-list-container">
                    <div className="expense-header">
                        <h1>Expenses</h1>
                    </div>

                    <ExpenseFilterBar
                        searchQuery={filters.search}
                        setSearchQuery={(val) => {
                            setFilters(prev => ({ ...prev, search: val }));
                            setPage(1);
                        }}
                        statusFilter={filters.billing_status}
                        setStatusFilter={(val) => {
                            setFilters(prev => ({ ...prev, billing_status: val }));
                            setPage(1);
                        }}
                        onOpenFilters={() => setIsFilterModalOpen(true)}
                    />

                    <ExpenseAdvancedFilterModal
                        isOpen={isFilterModalOpen}
                        onClose={() => setIsFilterModalOpen(false)}
                        filters={filters}
                        onApply={(newFilters) => {
                            setFilters(newFilters);
                            setPage(1);
                        }}
                        onClear={() => {
                            setFilters({
                                search: "",
                                billing_status: "all",
                                category: "",
                                client: "",
                                payment_mode: "",
                                date_from: "",
                                date_to: ""
                            });
                            setPage(1);
                        }}
                    />

                    <div className="table-container">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Expense #</th>
                                    <th>Category</th>
                                    <th>Client</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: "right" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: "center", padding: "40px" }}>
                                            Loading expenses...
                                        </td>
                                    </tr>
                                ) : expenses.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: "center", padding: "40px" }}>
                                            No expenses found.
                                        </td>
                                    </tr>
                                ) : (
                                    expenses.map((expense) => (
                                        <tr key={expense._id}>
                                            <td style={{ color: '#64748b', fontWeight: 500 }}>{formatDate(expense.date)}</td>
                                            <td>
                                                <span
                                                    style={{ fontWeight: 800, color: "var(--primary-accent)", cursor: "pointer", fontFamily: 'Space Mono, monospace' }}
                                                    onClick={() => navigate(`/finance/expenses/${expense._id}`)}
                                                >
                                                    {expense.expense_no}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="category-tag">
                                                    {expense.category?.name || "Uncategorized"}
                                                </span>
                                            </td>
                                            <td>
                                                {expense.client ? (
                                                    <span style={{ fontWeight: 600, color: '#1e293b' }}>
                                                        {expense.client.name}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: "#94a3b8" }}>-</span>
                                                )}
                                            </td>
                                            <td style={{ fontWeight: 800, color: '#0f172a' }}>
                                                {formatCurrency(expense.total_amount)}
                                            </td>
                                            <td>
                                                <span className={`status-badge ${expense.billing_status}`}>
                                                    {expense.billing_status?.replace("_", " ")}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="action-group">
                                                    <button
                                                        className="icon-btn"
                                                        title="View"
                                                        onClick={() => navigate(`/finance/expenses/${expense._id}`)}
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        className="icon-btn"
                                                        title="Edit"
                                                        onClick={() => navigate(`/finance/expenses/edit/${expense._id}`)}
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button className="icon-btn delete" title="Delete">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        {pagination.total_pages > 1 && (
                            <div className="pagination" style={{ padding: '20px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(page - 1)}
                                    className="toggle-btn"
                                    style={{ padding: '8px 16px', borderRadius: '8px' }}
                                >
                                    Previous
                                </button>
                                <span style={{ alignSelf: 'center', fontWeight: 600 }}>Page {page} of {pagination.total_pages}</span>
                                <button
                                    disabled={page === pagination.total_pages}
                                    onClick={() => setPage(page + 1)}
                                    className="toggle-btn"
                                    style={{ padding: '8px 16px', borderRadius: '8px' }}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ExpenseList;
