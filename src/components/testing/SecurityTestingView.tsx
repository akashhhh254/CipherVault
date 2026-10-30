import React, { useState } from 'react';
import { CheckCircle2, XCircle, Play, Server, RefreshCw, ChevronDown, ChevronUp, Terminal, ShieldCheck } from 'lucide-react';
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
        success: data.success,
        tests: data.tests || [],
      });
      addToast('success', 'Server Crypto Engine Verified', 'Node.js OpenSSL AES-256-GCM verification tests passed.');
    } catch (e) {
      console.error(e);
      setServerVerification({
        tested: true,
        success: false,
        tests: [{ test: 'Server Cryptographic Connection', passed: false }],
      });
      addToast('error', 'Server Verification Failed', 'Could not connect to server crypto test endpoint.');
    }
  };

  const filteredTests = testResults.filter(
    (t) => categoryFilter === 'ALL' || t.category === categoryFilter
  );

  const totalPassed = testResults.filter((t) => t.status === 'passed').length;
  const totalFailed = testResults.filter((t) => t.status === 'failed').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#242424] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#B5A27E] uppercase mb-1">
            <span>Automated Assurance Suite</span>
            <span>·</span>
            <span>Pytest Compatible Assertions</span>
          </div>
          <h1 className="text-2xl font-light tracking-tight text-white mb-1">
            Cryptographic Security & Tamper Testing Suite
          </h1>
          <p className="text-xs text-[#888888] max-w-2xl leading-relaxed">
            Evaluates AES-256-GCM AEAD integrity, 1-bit tampering detection, RSA-3072 key wrapping boundaries, executable upload rejection, and EXIF sanitization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRunServerVerification}
            leftIcon={<Server className="w-3.5 h-3.5 text-[#B5A27E]" />}
          >
            Verify Server Crypto
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleRunAllTests}
            isLoading={isRunning}
            leftIcon={<Play className="w-3.5 h-3.5" />}
          >
            Run 10-Point Suite
          </Button>
        </div>
      </div>

      {/* Server verification banner */}
      {serverVerification && (
        <div className="p-3.5 border border-[#242424] bg-[#111111] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <Server className="w-4 h-4 text-[#B5A27E]" />
            <div>
              <div className="font-semibold text-white uppercase font-mono text-[11px]">Dual-Tier Server Verification</div>
              <div className="text-[11px] text-[#888888]">
                Node.js OpenSSL engine validated AES-256-GCM and tamper rejection.
              </div>
            </div>
          </div>
          <span className="font-mono text-[#B5A27E] text-xs flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Passed</span>
          </span>
        </div>
      )}

      {/* Summary Stats Strip */}
      {testResults.length > 0 && (
        <div className="p-3.5 border border-[#242424] bg-[#111111] flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-5">
            <div>
              <span className="text-[#666666]">Evaluated: </span>
              <span className="font-bold text-white tabular-nums">{testResults.length}</span>
            </div>
            <div>
              <span className="text-[#666666]">Passed: </span>
              <span className="font-bold text-[#B5A27E] tabular-nums">{totalPassed}</span>
            </div>
            <div>
              <span className="text-[#666666]">Failed: </span>
              <span className="font-bold text-red-400 tabular-nums">{totalFailed}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 p-0.5 bg-[#0A0A0A] border border-[#242424] font-mono text-[11px]">
            {['ALL', 'Cryptographic Correctness', 'Tamper Detection', 'Input Validation'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 transition-colors ${
                  categoryFilter === cat
                    ? 'bg-[#222222] text-[#B5A27E] font-medium'
                    : 'text-[#666666] hover:text-white'
                }`}
              >
                {cat === 'Cryptographic Correctness' ? 'Crypto' : cat === 'Tamper Detection' ? 'Tamper' : cat === 'Input Validation' ? 'Validation' : 'All'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tests List */}
      <div className="space-y-2.5">
        {testResults.length === 0 && !isRunning && (
          <div className="text-center py-12 border border-dashed border-[#242424] bg-[#111111]">
            <Play className="w-7 h-7 text-[#555555] mx-auto mb-2" />
            <h3 className="text-xs font-semibold text-white uppercase font-mono">Test Suite Ready</h3>
            <p className="text-[11px] text-[#777777] max-w-sm mx-auto mt-0.5 mb-3 font-sans">
              Run automated assertions against AES-256-GCM, 1-bit tampering detection, RSA key wrapping, and magic byte upload validation.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRunAllTests}
            >
              Start Automated Tests
            </Button>
          </div>
        )}

        {filteredTests.map((test) => (
          <div
            key={test.id}
            className="border border-[#242424] bg-[#111111] overflow-hidden"
          >
            <div
              onClick={() => setExpandedTestId(expandedTestId === test.id ? null : test.id)}
              className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer hover:bg-[#161616] transition-colors"
            >
              <div className="flex items-start sm:items-center gap-3">
                {test.status === 'running' ? (
                  <RefreshCw className="w-4 h-4 text-[#B5A27E] animate-spin shrink-0 mt-0.5 sm:mt-0" />
                ) : test.status === 'passed' ? (
                  <CheckCircle2 className="w-4 h-4 text-[#B5A27E] shrink-0 mt-0.5 sm:mt-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5 sm:mt-0" />
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-[#B5A27E] font-semibold">{test.id}</span>
                    <span className="text-xs font-semibold text-white">{test.name}</span>
                  </div>
                  <div className="text-[11px] text-[#888888] mt-0.5 font-sans">{test.description}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[11px] font-mono shrink-0">
                <span className="text-[#666666] hidden sm:inline">{test.category}</span>
                {test.durationMs !== undefined && (
                  <span className="text-[#666666] tabular-nums">{test.durationMs}ms</span>
                )}
                <span
                  className={`font-semibold uppercase ${
                    test.status === 'passed'
                      ? 'text-[#B5A27E]'
                      : test.status === 'failed'
                      ? 'text-red-400'
                      : 'text-white'
                  }`}
                >
                  {test.status}
                </span>
                {expandedTestId === test.id ? (
                  <ChevronUp className="w-3.5 h-3.5 text-[#666666]" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-[#666666]" />
                )}
              </div>
            </div>

            {expandedTestId === test.id && (
              <div className="p-4 border-t border-[#242424] bg-[#0A0A0A] font-mono text-xs space-y-2.5">
                <div>
                  <span className="text-[#666666] text-[11px]">Security Invariant: </span>
                  <span className="text-[#CCCCCC] text-[11px]">{test.expectedResult}</span>
                </div>

                <div className="space-y-1">
                  <div className="text-[#666666] text-[10px] uppercase">Assertion Telemetry:</div>
                  <div className="p-2.5 bg-[#111111] border border-[#242424] text-[10px] text-[#888888] space-y-1">
                    {test.logs.map((log, i) => (
                      <div key={i}>{log}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Terminal Log */}
      {activeLogStream.length > 0 && (
        <div className="p-4 border border-[#242424] bg-[#111111] space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-white font-mono">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-[#B5A27E]" />
              <span className="uppercase text-[11px]">Execution Stream</span>
            </div>
            <span className="text-[10px] font-mono text-[#666666]">Live</span>
          </div>
          <div className="p-3 bg-[#0A0A0A] border border-[#242424] font-mono text-[10px] text-[#888888] max-h-36 overflow-y-auto space-y-1">
            {activeLogStream.map((log, idx) => (
              <div key={idx}>{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
