import React, { useState } from 'react';
import { Search, Download, AlertTriangle, CheckCircle2, AlertOctagon, FileText, ChevronRight } from 'lucide-react';
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#242424] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#B5A27E] uppercase mb-1">
            <span>Immutable Audit Trail</span>
            <span>·</span>
            <span>SIEM Compatible</span>
          </div>
          <h1 className="text-2xl font-light tracking-tight text-white mb-1">
            Security Monitoring & Audit Logs
          </h1>
          <p className="text-xs text-[#888888]">
            Chronological ledger recording cryptographic operations, key authorizations, and adversarial tamper detections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJson}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export JSON
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 border border-[#242424] bg-[#111111] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by event, IP, or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-3.5 h-3.5" />}
          />
        </div>

        {/* Severity Filter Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-[#0A0A0A] border border-[#242424] font-mono text-[11px] shrink-0">
          {(['ALL', 'INFO', 'WARNING', 'CRITICAL'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-3 py-1 transition-colors cursor-pointer uppercase ${
                selectedSeverity === sev
                  ? 'bg-[#222222] text-[#B5A27E] font-medium'
                  : 'text-[#666666] hover:text-white'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="border border-[#242424] bg-[#111111] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[#666666] border-b border-[#242424] font-mono text-[11px] bg-[#0A0A0A]">
              <tr>
                <th className="py-2.5 px-4 font-medium">Timestamp (UTC)</th>
                <th className="py-2.5 px-4 font-medium">Severity</th>
                <th className="py-2.5 px-4 font-medium">Event Type</th>
                <th className="py-2.5 px-4 font-medium">Actor & IP</th>
                <th className="py-2.5 px-4 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F1F] font-mono text-[11px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#666666] font-sans">
                    No security events match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#161616] transition-colors">
                    <td className="py-2.5 px-4 tabular-nums text-[#888888] whitespace-nowrap text-[10px]">
                      {new Date(log.timestamp).toISOString().replace('T', ' ').slice(0, 19)}
                    </td>

                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold text-[10px] ${
                          log.severity === 'CRITICAL'
                            ? 'text-red-400'
                            : log.severity === 'WARNING'
                            ? 'text-amber-400'
                            : 'text-[#B5A27E]'
                        }`}
                      >
                        {log.severity === 'CRITICAL' && <AlertOctagon className="w-3 h-3" />}
                        {log.severity === 'WARNING' && <AlertTriangle className="w-3 h-3" />}
                        {log.severity === 'INFO' && <CheckCircle2 className="w-3 h-3" />}
                        <span>{log.severity}</span>
                      </span>
                    </td>

                    <td className="py-2.5 px-4 text-white font-medium whitespace-nowrap">
                      {log.eventType}
                    </td>

                    <td className="py-2.5 px-4 text-[#888888] whitespace-nowrap text-[10px]">
                      <div className="text-white">{log.username || 'System'}</div>
                      <div className="text-[#555555]">{log.ipAddress}</div>
                    </td>

                    <td className="py-2.5 px-4 font-sans text-[#AAAAAA] max-w-sm">
                      <div className="truncate text-xs">{log.details}</div>
                      {log.metadata && (
                        <button
                          onClick={() => setActiveJsonModal(log)}
                          className="text-[10px] font-mono text-[#B5A27E] hover:underline mt-0.5 flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>Inspect metadata</span>
                          <ChevronRight className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Metadata Inspector Modal */}
      {activeJsonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md border border-[#262626] bg-[#111111] shadow-2xl p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#242424]">
              <div className="text-xs font-semibold text-white uppercase font-mono">Event Telemetry Payload</div>
              <button
                onClick={() => setActiveJsonModal(null)}
                className="text-[#666666] hover:text-white"
              >
                ✕
              </button>
            </div>
            <pre className="p-3 bg-[#0A0A0A] border border-[#242424] font-mono text-[10px] text-[#888888] overflow-x-auto max-h-60">
              {JSON.stringify(activeJsonModal.metadata, null, 2)}
            </pre>
            <div className="flex justify-end pt-1">
              <Button
                variant="secondary"
                size="xs"
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
