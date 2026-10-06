import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Clock,
  AlertTriangle,
  Flame,
  PieChart,
  BarChart3,
  Calendar,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { AnalyticsData } from '../../types/index.ts';

export const StaffAnalytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(e => {
        console.error('Failed to load analytics:', e);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="text-center py-16 space-y-3">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-gray-500 font-medium">Aggregating kitchen metrics & sales data...</p>
      </div>
    );
  }

  const categoryEntries = Object.entries(data.categoryCounts || {});
  const maxCategoryCount = Math.max(...categoryEntries.map(([_, v]) => v), 1);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Canteen Performance & Analytics</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Operational throughput, daily revenue, peak hours, and stock monitoring
          </p>
        </div>
        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
          Live Daily Report
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">
              Today's Revenue
            </span>
            <div className="text-2xl font-black text-gray-900 font-mono mt-0.5">
              ₹{Number(data.todayRevenue).toFixed(2)}
            </div>
            <p className="text-[10px] text-emerald-600 font-medium mt-1">
              All time: ₹{Number(data.totalRevenue).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">
              Orders Processed
            </span>
            <div className="text-2xl font-black text-gray-900 font-mono mt-0.5">
              {data.todayOrdersCount} today
            </div>
            <p className="text-[10px] text-gray-500 font-medium mt-1">
              Total lifetime: {data.totalOrders}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">
              Busiest Pickup Hour
            </span>
            <div className="text-lg font-black text-gray-900 mt-1">
              {data.busiestHour}
            </div>
            <p className="text-[10px] text-amber-600 font-medium mt-1">
              Kitchen operates at maximum capacity
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">
              Average Prep Time
            </span>
            <div className="text-2xl font-black text-gray-900 mt-0.5 font-mono">
              ~{data.averagePrepMinutes} mins
            </div>
            <p className="text-[10px] text-blue-600 font-medium mt-1">
              98% orders ready on time
            </p>
          </div>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            Orders by Current Status
          </h3>

          <div className="space-y-3 text-xs">
            {Object.entries(data.statusCounts || {}).map(([st, count]) => {
              const pct = data.totalOrders > 0 ? ((count / data.totalOrders) * 100).toFixed(0) : '0';
              return (
                <div key={st} className="space-y-1">
                  <div className="flex justify-between font-bold text-gray-700 capitalize">
                    <span>{st}</span>
                    <span className="font-mono text-gray-900">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        st === 'collected'
                          ? 'bg-emerald-500'
                          : st === 'ready'
                          ? 'bg-teal-500'
                          : st === 'preparing'
                          ? 'bg-amber-500'
                          : st === 'cancelled'
                          ? 'bg-rose-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Catalog Categories Breakdown */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-orange-600" />
            Menu Distribution by Category
          </h3>

          <div className="space-y-3 text-xs">
            {categoryEntries.map(([cat, count]) => {
              const pct = ((count / maxCategoryCount) * 100).toFixed(0);
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between font-bold text-gray-700 capitalize">
                    <span>{cat}</span>
                    <span className="font-mono text-gray-900">{count} items</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stock Alerts if items running low */}
      {data.itemsRunningLow && data.itemsRunningLow.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h4 className="font-extrabold text-sm">
              Limited Stock Inventory Alerts ({data.itemsRunningLow.length} items)
            </h4>
          </div>
          <p className="text-xs text-amber-800">
            These dishes are marked with "Limited" availability. Consider replenishing kitchen supplies or updating availability in the menu tab.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
            {data.itemsRunningLow.map(item => (
              <div
                key={item.id}
                className="bg-white p-3 rounded-2xl border border-amber-200 text-xs flex items-center justify-between"
              >
                <span className="font-bold text-gray-900 truncate">{item.name}</span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md shrink-0">
                  Limited
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
