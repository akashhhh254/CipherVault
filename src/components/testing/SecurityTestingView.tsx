import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Play,
  Server,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Terminal,
  ShieldCheck,
} from 'lucide-react';
import { SecurityTestResult } from '../../types/crypto';
import { runSecurityTestSuite } from '../../lib/securityTests';
import { vaultStore } from '../../lib/vaultStore';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

export const SecurityTestingView: React.FC = () => {
  const { addToast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<SecurityTestResult[]>([]);
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [serverVerification, setServerVerification] = useState<{
    tested: boolean;
    success: boolean;
    tests: Array<{ test: string; passed: boolean }>;
  } | null>(null);
  const [activeLogStream, setActiveLogStream] = useState<string[]>([]);

  const handleRunAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setActiveLogStream(['[TEST-RUNNER] Initializing 10-point cryptographic security suite...']);

    try {
      const results = await runSecurityTestSuite((updated) => {
        setTestResults((prev) => {
          const idx = prev.findIndex((t) => t.id === updated.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = updated;
            return next;
          }
          return [...prev, updated];
        });

        if (updated.logs.length > 0) {
          const latestLog = updated.logs[updated.logs.length - 1];
          setActiveLogStream((prev) => [...prev, `[${updated.id}] ${latestLog}`]);
        }
      });

      const passed = results.filter((r) => r.status === 'passed').length;
      vaultStore.addAuditLog({
        id: `aud_${Date.now()}`,
        userId: vaultStore.getSession()?.userId,
        fileId: 'security_test_runner',
        filename: 'suite_execution',
        action: 'SECURITY_TEST_SUITE_RUN',
        status: 'SUCCESS',
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        details: `Automated test suite completed: ${passed}/${results.length} tests verified.`,
      });

      addToast('success', 'Security Suite Completed', `${passed} of ${results.length} assertions passed.`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunServerVerification = async () => {
    try {
      const res = await fetch('/api/security-tests/server-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setServerVerification({
        tested: true,
        success: Boolean(data.success),
        tests: data.tests || [],
      });
      addToast('success', 'Server Verification', 'OpenSSL AES-256-GCM tests completed.');
    } catch {
      setServerVerification({
        tested: true,
        success: false,
        tests: [{ test: 'Node.js Cryptographic API Reachability', passed: false }],
      });
      addToast('error', 'Server Check Failed', 'Could not reach backend verification endpoint.');
    }
  };

  const filteredTests = testResults.filter((t) =>
    categoryFilter === 'ALL' ? true : t.category === categoryFilter
  );

  const passedCount = testResults.filter((t) => t.status === 'passed').length;
  const failedCount = testResults.filter((t) => t.status === 'failed').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* Header */}
      <div className="border-b border-[#E5E5E5] pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#666666] mb-1 font-mono">
            <span>Automated Verification</span>
            <span aria-hidden="true">·</span>
            <span>Mathematical Assertions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
            Cryptographic Security Tests
          </h1>
          <p className="text-sm text-[#666666] mt-1 max-w-2xl leading-relaxed">
            Execute real mathematical assertions in your browser against AES-256-GCM, RSA-3072 OAEP key wrapping, Scrypt private key protection, and executable injection defenses.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="primary"
            size="md"
            onClick={handleRunAllTests}
            isLoading={isRunning}
            leftIcon={<Play className="w-4 h-4 fill-current" />}
            className="w-full sm:w-auto"
          >
            Run Test Suite
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={handleRunServerVerification}
            leftIcon={<Server className="w-4 h-4" />}
            className="hidden sm:inline-flex"
          >
            Server OpenSSL Check
          </Button>
        </div>
      </div>

      {/* Summary Scorecard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="border border-[#E5E5E5] bg-white rounded-lg p-4 shadow-xs">
          <div className="text-xs text-[#666666] font-medium">Tests Evaluated</div>
          <div className="text-2xl font-bold text-[#111111] mt-1 font-mono">
            {testResults.length} / 10
          </div>
        </div>

        <div className="border border-[#E5E5E5] bg-white rounded-lg p-4 shadow-xs">
          <div className="text-xs text-[#666666] font-medium">Passed Assertions</div>
          <div className="text-2xl font-bold text-[#16A34A] mt-1 font-mono">
            {passedCount}
          </div>
        </div>

        <div className="border border-[#E5E5E5] bg-white rounded-lg p-4 shadow-xs">
          <div className="text-xs text-[#666666] font-medium">Failed Assertions</div>
          <div className="text-2xl font-bold text-[#DC2626] mt-1 font-mono">
            {failedCount}
          </div>
        </div>

        <div className="border border-[#E5E5E5] bg-white rounded-lg p-4 shadow-xs">
          <div className="text-xs text-[#666666] font-medium">Server OpenSSL</div>
          <div className="text-sm font-semibold text-[#111111] mt-2">
            {serverVerification ? (
              serverVerification.success ? (
                <span className="text-[#16A34A]">Verified (Pass)</span>
              ) : (
                <span className="text-[#DC2626]">Failed</span>
              )
            ) : (
              <span className="text-[#888888]">Ready</span>
            )}
          </div>
        </div>
      </div>

      {/* Category Filter */}
      {testResults.length > 0 && (
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
          {['ALL', 'Cryptographic Correctness', 'Adversarial Tampering', 'Key Management', 'Image Ingestion'].map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[#111111] text-white'
                    : 'bg-[#F7F7F7] text-[#666666] hover:text-[#111111] border border-[#E5E5E5]'
                }`}
              >
                {cat}
              </button>
            )
          )}
        </div>
      )}

      {/* Tests Results List */}
      <div className="space-y-3">
        {testResults.length === 0 && !isRunning && (
          <div className="border border-[#E5E5E5] bg-white rounded-xl p-10 text-center text-[#666666]">
            <ShieldCheck className="w-8 h-8 mx-auto text-[#888888] mb-3" />
            <h2 className="text-base font-bold text-[#111111]">Ready to Execute Security Suite</h2>
            <p className="text-xs text-[#666666] mt-1 max-w-sm mx-auto">
              Click &quot;Run Test Suite&quot; to execute all 10 automated assertions covering 1-bit tampering, nonce reuse protection, and key wrapping.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRunAllTests}
              className="mt-4"
            >
              Start Automated Tests
            </Button>
          </div>
        )}

        {filteredTests.map((test) => {
          const isExpanded = expandedTestId === test.id;
          return (
            <div
              key={test.id}
              className="border border-[#E5E5E5] bg-white rounded-lg shadow-xs overflow-hidden text-xs"
            >
              <div
                onClick={() => setExpandedTestId(isExpanded ? null : test.id)}
                className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#FAFAFA] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {test.status === 'passed' ? (
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                  ) : test.status === 'failed' ? (
                    <XCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0 text-[#111111]" />
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-[#666666]">{test.id}</span>
                      <span className="font-semibold text-[#111111] truncate">{test.name}</span>
                    </div>
                    <div className="text-[11px] text-[#666666] mt-0.5">{test.category}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-[11px] text-[#666666] hidden sm:inline">
                    {test.durationMs}ms
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                      test.status === 'passed'
                        ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]'
                        : test.status === 'failed'
                        ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                        : 'bg-[#F7F7F7] text-[#666666] border border-[#E5E5E5]'
                    }`}
                  >
                    {test.status.toUpperCase()}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#888888]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#888888]" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 border-t border-[#E5E5E5] bg-[#F7F7F7] space-y-3">
                  <div>
                    <div className="font-semibold text-[#111111]">Description</div>
                    <p className="text-[#666666] mt-0.5 leading-relaxed">{test.description}</p>
                  </div>
                  <div>
                    <div className="font-semibold text-[#111111]">Expected Security Property</div>
                    <p className="text-[#666666] mt-0.5 font-mono text-[11px]">{test.expectedResult}</p>
                  </div>

                  <div>
                    <div className="font-semibold text-[#111111] mb-1">Execution Assertion Log</div>
                    <div className="bg-white border border-[#E5E5E5] rounded p-3 font-mono text-[11px] text-[#111111] space-y-1 max-h-40 overflow-y-auto">
                      {test.logs.map((log, i) => (
                        <div key={i} className="break-all">
                          <span className="text-[#888888] select-none">&gt; </span>
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Real-time Log Stream Terminal */}
      {activeLogStream.length > 0 && (
        <div className="border border-[#E5E5E5] bg-white rounded-xl p-5 shadow-xs space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#111111]" />
            Test Engine Execution Stream
          </div>
          <div className="bg-[#F7F7F7] border border-[#E5E5E5] rounded-lg p-3 font-mono text-[11px] text-[#111111] space-y-1 max-h-36 overflow-y-auto">
            {activeLogStream.slice(-8).map((line, i) => (
              <div key={i} className="break-all">
                {line}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
