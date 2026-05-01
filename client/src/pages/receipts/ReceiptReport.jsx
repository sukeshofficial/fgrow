import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
    ComposedChart,
    Area,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import {
    FiArrowLeft,
    FiArrowUpRight,
    FiDownload,
    FiRefreshCw,
    FiMoreVertical
} from "react-icons/fi";
import { TrendingUp, FileText, IndianRupee, Users } from "lucide-react";
import Sidebar from "../../components/SideBar";
import receiptService from "../../features/receipts/receiptService";
import "./ReceiptReport.css";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#6366f1"];

const ReceiptReport = () => {
    const navigate = useNavigate();
    const { data, isLoading, refetch, isFetching } = useQuery({
        queryKey: ["receipt-stats"],
        queryFn: async () => {
            const resp = await receiptService.getReceiptStats();
            return resp.data;
        },
        staleTime: 1000 * 60 * 5,
    });

    const handleChartClick = (filterType, filterValue) => {
        const params = new URLSearchParams();
        params.append(filterType, filterValue);
        params.append("fromReport", "true");
        navigate(`/finance/receipts?${params.toString()}`);
    };

    const [revViewMode, setRevViewMode] = useState("composed"); // 'composed', 'histogram', 'line'
    const [revTimeRange, setRevTimeRange] = useState("all");
    const [showRevMenu, setShowRevMenu] = useState(false);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setShowRevMenu(false);
        if (showRevMenu) {
            window.addEventListener('click', handleClickOutside);
        }
        return () => window.removeEventListener('click', handleClickOutside);
    }, [showRevMenu]);

    if (isLoading) return <div className="p-8">Loading Reports...</div>;

    const stats = data || {
        summary: { totalReceived: 0, tdsAmount: 0, totalAmount: 0, receiptCount: 0 },
        statusBreakdown: [],
        receiptsOverTime: [],
        clientReceipts: [],
    };

    const handleExport = () => {
        let scvContent = "data:text/csv;charset=utf-8,";
        scvContent += "Receipt Report Summary\n";
        scvContent += `Total Received,${stats.summary.totalReceived}\n`;
        scvContent += `TDS Amount,${stats.summary.tdsAmount}\n`;
        scvContent += `Receipt Count,${stats.summary.receiptCount}\n`;
        scvContent += `Average Value,${stats.summary.totalReceived / (stats.summary.receiptCount || 1)}\n\n`;

        scvContent += "Status Breakdown\nStatus,Count\n";
        stats.statusBreakdown.forEach(item => {
            scvContent += `${item.status},${item.count}\n`;
        });

        scvContent += "\nReceipt Trends\nMonth,Received\n";
        stats.receiptsOverTime.forEach(item => {
            scvContent += `${item.period},${item.received}\n`;
        });

        scvContent += "\nTop Clients\nClient,Received\n";
        stats.clientReceipts.forEach(item => {
            scvContent += `${item.name},${item.received}\n`;
        });

        const encodedUri = encodeURI(scvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `receipt_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val || 0);
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const seen = new Set();
            const uniquePayload = payload.filter(entry => {
                if (seen.has(entry.name)) return false;
                seen.add(entry.name);
                return true;
            });

            return (
                <div className="custom-tooltip" style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }}>
                    <p className="label">{`${label}`}</p>
                    {uniquePayload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }}>
                            {`${entry.name}: ${formatCurrency(entry.value)}`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <>
            <Sidebar />
            <div className="receipt-report">
                <div className="report-header-section">
                    <div className="breadcrumb-nav">
                        <button className="back-btn-pill" onClick={() => navigate("/finance/receipts")}>
                            <FiArrowLeft />
                            Back to Receipts
                        </button>
                    </div>

                    <div className="header-main-row">
                        <div className="header-title-container">
                            <div className="header-title-main">
                                <h1 className="welcome-text">Collections Analytics</h1>
                                <button
                                    className="refresh-btn"
                                    onClick={() => refetch()}
                                    disabled={isFetching}
                                    title="Refresh Data"
                                >
                                    <FiRefreshCw className={isFetching ? "spin" : ""} />
                                </button>
                            </div>
                            <p className="subtitle">Insights into receipt collections and payment trends.</p>
                        </div>

                        <div className="header-actions">
                            <button className="export-btn" onClick={handleExport}>
                                <FiDownload />
                                Export Report
                            </button>
                        </div>
                    </div>
                </div>

                <div className="metric-cards-row">
                    <div className="metric-card">
                        <div className="m-card-top">
                            <span className="m-label">Total Received</span>
                            <div className="m-icon received"><IndianRupee size={16} /></div>
                        </div>
                        <h2 className="m-value">{formatCurrency(stats.summary.totalReceived)}</h2>
                        <div className="m-card-footer">
                            <span className="m-trend positive">
                                <FiArrowUpRight /> Active <span className="m-vs">Collections</span>
                            </span>
                            <button className="m-view-details" onClick={() => navigate("/finance/receipts")}>
                                View Details <FiArrowUpRight />
                            </button>
                        </div>
                    </div>

                    <div className="metric-card">
                        <div className="m-card-top">
                            <span className="m-label">Total TDS</span>
                            <div className="m-icon tds"><TrendingUp size={16} /></div>
                        </div>
                        <h2 className="m-value">{formatCurrency(stats.summary.tdsAmount)}</h2>
                        <div className="m-card-footer">
                            <span className="m-trend positive">
                                Total Deductions
                            </span>
                            <button className="m-view-details" onClick={() => navigate("/finance/receipts")}>
                                View Details <FiArrowUpRight />
                            </button>
                        </div>
                    </div>

                    <div className="metric-card">
                        <div className="m-card-top">
                            <span className="m-label">Average Value</span>
                            <div className="m-icon avg"><TrendingUp size={16} /></div>
                        </div>
                        <h2 className="m-value">
                            {formatCurrency(stats.summary.totalReceived / (stats.summary.receiptCount || 1))}
                        </h2>
                        <div className="m-card-footer">
                            <span className="m-trend positive">
                                Per Receipt
                            </span>
                            <button className="m-view-details" onClick={() => navigate("/finance/receipts")}>
                                View Details <FiArrowUpRight />
                            </button>
                        </div>
                    </div>

                    <div className="metric-card">
                        <div className="m-card-top">
                            <span className="m-label">Receipt Count</span>
                            <div className="m-icon count"><FileText size={16} /></div>
                        </div>
                        <h2 className="m-value">{stats.summary.receiptCount}</h2>
                        <div className="m-card-footer">
                            <span className="m-trend positive">
                                Total Issued
                            </span>
                            <button className="m-view-details" onClick={() => navigate("/finance/receipts")}>
                                View Details <FiArrowUpRight />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="main-content-grid">
                    <div className="chart-panel main-chart">
                        <div className="panel-header">
                            <div>
                                <h3 className="panel-title">Collections Overview</h3>
                                <div className="panel-value-row">
                                    <span className="panel-main-value">{formatCurrency(stats.summary.totalReceived)}</span>
                                    <span className="trend-pill">+12.4% <FiArrowUpRight /></span>
                                </div>
                            </div>
                            <div className="panel-header-actions">
                                <button
                                    className="action-dots-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowRevMenu(!showRevMenu);
                                    }}
                                >
                                    <FiMoreVertical />
                                </button>

                                {showRevMenu && (
                                    <div className="chart-dropdown-menu">
                                        <div className="chart-menu-section">
                                            <span className="chart-menu-label">View Mode</span>
                                            <button
                                                className={`chart-menu-item ${revViewMode === "composed" ? "active" : ""}`}
                                                onClick={() => setRevViewMode("composed")}
                                            >
                                                Composed View
                                            </button>
                                            <button
                                                className={`chart-menu-item ${revViewMode === "histogram" ? "active" : ""}`}
                                                onClick={() => setRevViewMode("histogram")}
                                            >
                                                Histogram Only
                                            </button>
                                            <button
                                                className={`chart-menu-item ${revViewMode === "line" ? "active" : ""}`}
                                                onClick={() => setRevViewMode("line")}
                                            >
                                                Line Area Only
                                            </button>
                                        </div>
                                        <div className="chart-menu-divider" />
                                        <div className="chart-menu-section">
                                            <span className="chart-menu-label">Time Period</span>
                                            <button
                                                className={`chart-menu-item ${revTimeRange === "3m" ? "active" : ""}`}
                                                onClick={() => setRevTimeRange("3m")}
                                            >
                                                Last 3 Months
                                            </button>
                                            <button
                                                className={`chart-menu-item ${revTimeRange === "6m" ? "active" : ""}`}
                                                onClick={() => setRevTimeRange("6m")}
                                            >
                                                Last 6 Months
                                            </button>
                                            <button
                                                className={`chart-menu-item ${revTimeRange === "all" ? "active" : ""}`}
                                                onClick={() => setRevTimeRange("all")}
                                            >
                                                All Time
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="chart-canvas">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={
                                    revTimeRange === "3m" ? (stats.receiptsOverTime || []).slice(-3) :
                                        revTimeRange === "6m" ? (stats.receiptsOverTime || []).slice(-6) :
                                            (stats.receiptsOverTime || [])
                                }>
                                    <defs>
                                        <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="period"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        tickFormatter={(val) => `₹${val / 1000}k`}
                                    />
                                    {(revViewMode === "composed" || revViewMode === "histogram") && (
                                        <Bar dataKey="received" barSize={40} fill="#f1f5f9" radius={[4, 4, 0, 0]} />
                                    )}
                                    {(revViewMode === "composed" || revViewMode === "line") && (
                                        <Area
                                            type="monotone"
                                            dataKey="received"
                                            stroke="#3b82f6"
                                            strokeWidth={4}
                                            fillOpacity={1}
                                            fill="url(#colorRec)"
                                        />
                                    )}
                                    <Tooltip content={<CustomTooltip />} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="side-panel">
                        <div className="chart-panel small-chart">
                            <h3 className="panel-title">Receipt Status</h3>
                            <div className="pie-canvas">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stats.statusBreakdown}
                                            innerRadius={60}
                                            outerRadius={85}
                                            paddingAngle={8}
                                            dataKey="count"
                                            nameKey="status"
                                            onClick={(data) => handleChartClick("status", data.status)}
                                        >
                                            {stats.statusBreakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="pie-legend">
                                {stats.statusBreakdown.map((item, index) => (
                                    <div key={index} className="legend-item">
                                        <span className="dot" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                        <span className="label text-capitalize">{item.status.replace('_', ' ')}</span>
                                        <span className="count">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="chart-panel list-panel">
                            <div className="panel-header">
                                <h3 className="panel-title">Top Clients</h3>
                            </div>
                            <div className="top-list">
                                {stats.clientReceipts.slice(0, 5).map((client, index) => (
                                    <div key={index} className="list-item" onClick={() => handleChartClick("client", client._id)}>
                                        <div className="item-left">
                                            <div className="item-avatar">
                                                <Users size={16} />
                                            </div>
                                            <div className="item-info">
                                                <p className="item-name">{client.name}</p>
                                                <p className="item-sub">Collection Value</p>
                                            </div>
                                        </div>
                                        <div className="item-right">
                                            <p className="item-value">{formatCurrency(client.received)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ReceiptReport;
