import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Cpu, CheckCircle2, RefreshCw } from 'lucide-react';
import { simulateEcbPatternLeakage } from '../../lib/desComparison';
import { Button } from '../ui/Button';

export const DesComparisonView: React.FC = () => {
  const [simulationData, setSimulationData] = useState<{
    plaintextPixels: number[];
    ecbCiphertextPixels: number[];
    gcmCiphertextPixels: number[];
  } | null>(null);

  const canvasPlaintextRef = useRef<HTMLCanvasElement>(null);
  const canvasEcbRef = useRef<HTMLCanvasElement>(null);
  const canvasGcmRef = useRef<HTMLCanvasElement>(null);

  const [activeTab, setActiveTab] = useState<'matrix' | 'visual_leakage' | 'complexity'>('matrix');

  useEffect(() => {
    const data = simulateEcbPatternLeakage(64, 64);
    setSimulationData(data);
  }, []);

  useEffect(() => {
    if (!simulationData) return;
    const renderCanvas = (
      canvas: HTMLCanvasElement | null,
      pixels: number[]
    ) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const imgData = ctx.createImageData(64, 64);
      for (let i = 0; i < pixels.length; i++) {
        const val = pixels[i];
        imgData.data[i * 4 + 0] = val;
        imgData.data[i * 4 + 1] = val;
        imgData.data[i * 4 + 2] = val;
        imgData.data[i * 4 + 3] = 255;
      }
      ctx.putImageData(imgData, 0, 0);
    };

    renderCanvas(canvasPlaintextRef.current, simulationData.plaintextPixels);
    renderCanvas(canvasEcbRef.current, simulationData.ecbCiphertextPixels);
    renderCanvas(canvasGcmRef.current, simulationData.gcmCiphertextPixels);
  }, [simulationData, activeTab]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      <div className="border-b border-[#242424] pb-4">
        <div className="flex items-center gap-2 text-xs font-mono text-[#B5A27E] uppercase mb-1">
          <span>Isolated Educational Module</span>
          <span>·</span>
          <span>Cryptanalytic Benchmark</span>
        </div>
        <h1 className="text-2xl font-light tracking-tight text-white mb-1">
          Comparative Cryptanalysis: Obsolete DES vs AES-256-GCM
        </h1>
        <p className="text-xs text-[#888888] max-w-2xl leading-relaxed">
          Demonstrates why 56-bit DES is obsolete and vulnerable. Examines tiny key spaces, Sweet32 collisions on 64-bit blocks, and visual Electronic Codebook (ECB) pattern leakage.
        </p>
      </div>

      {/* Notice Banner */}
      <div className="p-4 border border-[#333333] bg-[#141414] text-xs flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-[#B5A27E] shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-white uppercase font-mono tracking-wider">Strict Production Policy</div>
          <p className="mt-0.5 text-[#AAAAAA] text-[11px] leading-relaxed">
            CipherVault strictly prohibits DES for storing or encrypting user images. The application utilizes AES-256-GCM authenticated encryption paired with RSA-3072 OAEP key wrapping.
          </p>
        </div>
      </div>

      {/* Segmented Control */}
      <div className="flex items-center gap-1 p-1 bg-[#111111] border border-[#242424]">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-3 py-1.5 text-xs font-mono transition-colors whitespace-nowrap cursor-pointer uppercase ${
            activeTab === 'matrix'
              ? 'bg-[#222222] text-[#B5A27E] font-semibold border border-[#333]'
              : 'text-[#888888] hover:text-white'
          }`}
        >
          Cryptographic Matrix
        </button>
        <button
          onClick={() => setActiveTab('visual_leakage')}
          className={`px-3 py-1.5 text-xs font-mono transition-colors whitespace-nowrap cursor-pointer uppercase ${
            activeTab === 'visual_leakage'
              ? 'bg-[#222222] text-[#B5A27E] font-semibold border border-[#333]'
              : 'text-[#888888] hover:text-white'
          }`}
        >
          ECB Pattern Leakage (Visual Simulation)
        </button>
        <button
          onClick={() => setActiveTab('complexity')}
          className={`px-3 py-1.5 text-xs font-mono transition-colors whitespace-nowrap cursor-pointer uppercase ${
            activeTab === 'complexity'
              ? 'bg-[#222222] text-[#B5A27E] font-semibold border border-[#333]'
              : 'text-[#888888] hover:text-white'
          }`}
        >
          Brute-Force Keyspace & Quantum Margin
        </button>
      </div>

      {/* Tab 1: Comparison Matrix */}
      {activeTab === 'matrix' && (
        <div className="border border-[#242424] bg-[#111111] overflow-hidden">
          <div className="p-4 border-b border-[#242424] bg-[#0A0A0A]">
            <h2 className="text-xs font-semibold text-white uppercase font-mono tracking-wider">Algorithm Specification Comparison</h2>
            <p className="text-[11px] text-[#777777] mt-0.5">
              Direct parameter comparison between DES (FIPS 46-3 withdrawn) and AES-256-GCM (NIST FIPS 197).
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[#666666] border-b border-[#242424] font-mono text-[11px] bg-[#0A0A0A]">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Property</th>
                  <th className="py-2.5 px-4 font-medium text-red-400">DES (Obsolete)</th>
                  <th className="py-2.5 px-4 font-medium text-[#888888]">Triple-DES (Deprecated)</th>
                  <th className="py-2.5 px-4 font-medium text-[#B5A27E]">AES-256-GCM (CipherVault Standard)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F1F] font-mono text-[11px]">
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-white">Key Length</td>
                  <td className="py-2.5 px-4 text-red-300">56 bits</td>
                  <td className="py-2.5 px-4 text-[#888888]">112 bits (effective)</td>
                  <td className="py-2.5 px-4 text-[#B5A27E] font-bold">256 bits</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-white">Block Size</td>
                  <td className="py-2.5 px-4 text-red-300">64 bits</td>
                  <td className="py-2.5 px-4 text-[#888888]">64 bits (Sweet32 risk)</td>
                  <td className="py-2.5 px-4 text-[#B5A27E] font-bold">128 bits</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-white">Structure</td>
                  <td className="py-2.5 px-4 font-sans text-[#777777]">16-round Feistel</td>
                  <td className="py-2.5 px-4 font-sans text-[#777777]">48-round Feistel</td>
                  <td className="py-2.5 px-4 font-sans text-white">14-round SPN</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-white">Authenticated AEAD</td>
                  <td className="py-2.5 px-4 text-red-400">NO (Malleable)</td>
                  <td className="py-2.5 px-4 text-red-400">NO (Malleable)</td>
                  <td className="py-2.5 px-4 text-[#B5A27E] font-bold">YES (128-bit GMAC Tag)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-white">Keyspace</td>
                  <td className="py-2.5 px-4 text-red-300">2^56 ≈ 7.2 × 10^16</td>
                  <td className="py-2.5 px-4 text-[#888888]">2^112 ≈ 5.1 × 10^33</td>
                  <td className="py-2.5 px-4 text-[#B5A27E] font-bold">2^256 ≈ 1.15 × 10^77</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-white">Modern Break Time</td>
                  <td className="py-2.5 px-4 text-red-400">&lt; 5 minutes (FPGA cluster)</td>
                  <td className="py-2.5 px-4 text-[#777777]">Impractical for brute force</td>
                  <td className="py-2.5 px-4 text-[#B5A27E] font-bold">&gt; Age of Universe (10^50+ yrs)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-white">NIST Regulatory Status</td>
                  <td className="py-2.5 px-4 text-red-400">WITHDRAWN (FIPS 46-3)</td>
                  <td className="py-2.5 px-4 text-[#888888]">DISALLOWED (SP 800-131A)</td>
                  <td className="py-2.5 px-4 text-[#B5A27E] font-bold">NIST FIPS 197 APPROVED</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Visual ECB Pattern Leakage */}
      {activeTab === 'visual_leakage' && (
        <div className="border border-[#242424] bg-[#111111] p-6 space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-white uppercase font-mono">
              The Electronic Codebook (ECB) Pattern Leakage Vulnerability
            </h2>
            <p className="text-xs text-[#888888] mt-1 max-w-2xl leading-relaxed">
              When images are encrypted using naive Electronic Codebook (ECB) mode, identical plaintext blocks map deterministically to identical ciphertext blocks. The visual structure of the confidential image remains exposed!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="p-4 bg-[#0A0A0A] border border-[#242424] text-center space-y-2.5">
              <div className="text-xs font-mono text-white">1. Original Image</div>
              <div className="flex justify-center">
                <canvas
                  ref={canvasPlaintextRef}
                  width={64}
                  height={64}
                  className="w-28 h-28 border border-[#333333]"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <div className="text-[10px] font-mono text-[#777777]">
                Visual redundancy present
              </div>
            </div>

            <div className="p-4 bg-red-950/20 border border-red-900/60 text-center space-y-2.5">
              <div className="text-xs font-mono text-red-300">2. DES/AES-ECB Ciphertext</div>
              <div className="flex justify-center">
                <canvas
                  ref={canvasEcbRef}
                  width={64}
                  height={64}
                  className="w-28 h-28 border border-red-900/60"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <div className="text-[10px] font-mono text-red-400">
                Vulnerability: Outlines visible
              </div>
            </div>

            <div className="p-4 bg-[#141414] border border-[#B5A27E]/40 text-center space-y-2.5">
              <div className="text-xs font-mono text-[#B5A27E]">3. AES-256-GCM AEAD</div>
              <div className="flex justify-center">
                <canvas
                  ref={canvasGcmRef}
                  width={64}
                  height={64}
                  className="w-28 h-28 border border-[#B5A27E]/60"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <div className="text-[10px] font-mono text-[#B5A27E]">
                Entropy ≈ 7.999 bits/byte
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Complexity Math */}
      {activeTab === 'complexity' && (
        <div className="border border-[#242424] bg-[#111111] p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white uppercase font-mono">Keyspace Mathematics: 56-bit vs 256-bit</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-[#0A0A0A] border border-[#242424] space-y-2">
              <div className="font-semibold text-red-400 font-mono">The 56-Bit Collapse of DES</div>
              <p className="text-[#888888] leading-relaxed text-[11px]">
                A 56-bit key has 72,057,594,037,927,936 combinations. In 1998, EFF&apos;s &quot;Deep Crack&quot; broke DES in 56 hours. A modern cluster of 64 RTX 4090 GPUs can exhaust the entire keyspace in under two hours.
              </p>
            </div>

            <div className="p-4 bg-[#0A0A0A] border border-[#242424] space-y-2">
              <div className="font-semibold text-[#B5A27E] font-mono">The Scale of AES-256</div>
              <p className="text-[#888888] leading-relaxed text-[11px]">
                AES-256 offers 1.1579 × 10^77 combinations. Even if every atom in the observable universe were a supercomputer testing a billion keys per second since the Big Bang, less than 0.000000000000000000000000001% of the keyspace would be tested.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
