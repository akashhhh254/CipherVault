import React, { useState } from 'react';
import {
  Search,
  Download,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  FileText,
  ChevronRight,
  X,
} from 'lucide-react';
import { SecurityAuditLog } from '../../types/crypto';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';

interface AuditLogsViewProps {
  logs: SecurityAuditLog[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ logs }) => {
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<'ALL' | 'INFO' | 'WARNING' | 'CRITICAL'>('ALL');
  const [activeJsonModal, setActiveJsonModal] = useState<SecurityAuditLog | null>(null);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = selectedSeverity === 'ALL' || log.severity === selectedSeverity;
    return matchesSearch && matchesSeverity;
  });

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ciphervault_audit_logs_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('info', 'Exported JSON Audit Trail', `Saved ${logs.length} audit records.`);
  };

  const handleExportCsv = () => {
    const headers = ['Timestamp', 'Severity', 'Event Type', 'User ID', 'IP Address', 'Details'];
    const rows = logs.map((l) => [
      l.timestamp,
      l.severity,
      l.eventType,
      l.userId || 'N/A',
      `"${l.ipAddress}"`,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ciphervault_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('info', 'Exported CSV Audit Trail', `Saved ${logs.length} audit records.`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#666666] mb-1">
            <span>Security Activity</span>
            <span aria-hidden="true">·</span>
            <span>SIEM Compatible Trail</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
            Audit Logs
          </h1>
          <p className="text-sm text-[#666666] mt-1">
            Immutable chronological record of all cryptographic operations, key handshakes, and tamper events.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportJson}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export JSON
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <Input
            placeholder="Search audit trail by event type, IP, or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-1 bg-[#F7F7F7] border border-[#E5E5E5] p-1 rounded-lg w-full sm:w-auto overflow-x-auto text-xs">
          {(['ALL', 'INFO', 'WARNING', 'CRITICAL'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer select-none whitespace-nowrap ${
                selectedSeverity === sev
                  ? 'bg-white text-[#111111] font-semibold shadow-xs'
                  : 'text-[#666666] hover:text-[#111111]'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="border border-[#E5E5E5] bg-white rounded-xl shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-[#666666]">
            <FileText className="w-8 h-8 mx-auto text-[#888888] mb-3" />
            <p className="text-sm font-semibold text-[#111111]">No audit events found</p>
            <p className="text-xs text-[#666666] mt-1">Try resetting the severity or search term filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F7F7] border-b border-[#E5E5E5] text-[#666666] uppercase font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Severity</th>
                  <th className="py-3 px-4 font-semibold">Event Type</th>
                  <th className="py-3 px-4 font-semibold">IP Address</th>
                  <th className="py-3 px-4 font-semibold">Event Details</th>
                  <th className="py-3 px-4 font-semibold text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5] text-[#111111]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-[#666666] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          log.severity === 'CRITICAL'
                            ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                            : log.severity === 'WARNING'
                            ? 'bg-[#FFFBEB] text-[#D97706] border border-[#FEF08A]'
                            : 'bg-[#F7F7F7] text-[#111111] border border-[#E5E5E5]'
                        }`}
                      >
                        {log.severity}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] font-semibold">
                      {log.eventType}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-[#666666] whitespace-nowrap">
                      {log.ipAddress}
                    </td>

                    <td className="py-3 px-4 text-[#666666] max-w-xs truncate">
                      {log.details}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setActiveJsonModal(log)}
                      >
                        Raw
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Raw Event Modal */}
      {activeJsonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="border border-[#E5E5E5] bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-[#E5E5E5]">
              <div>
                <h2 className="text-base font-bold text-[#111111]">
                  SIEM Audit Event Record
                </h2>
                <p className="text-xs text-[#666666] font-mono mt-0.5">{activeJsonModal.id}</p>
              </div>
              <button
                onClick={() => setActiveJsonModal(null)}
                className="text-[#888888] hover:text-[#111111] p-1 rounded-sm cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <pre className="bg-[#F7F7F7] border border-[#E5E5E5] rounded p-3 text-[11px] font-mono text-[#111111] overflow-x-auto">
              {JSON.stringify(activeJsonModal, null, 2)}
            </pre>

            <div className="flex justify-end pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveJsonModal(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
