import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Cpu, CheckCircle2, RefreshCw, Layers } from 'lucide-react';
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
      <div className="border-b border-[#E5E5E5] pb-5">
        <div className="flex items-center gap-2 text-xs font-mono text-[#666666] uppercase mb-1">
          <span>Comparative Cryptanalysis</span>
          <span aria-hidden="true">·</span>
          <span>NIST FIPS 197 Standards</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
          DES (Obsolete) vs. AES-256-GCM
        </h1>
        <p className="text-sm text-[#666666] max-w-2xl leading-relaxed mt-1">
          Technical comparison illustrating why 56-bit DES is obsolete, examining tiny keyspace vulnerabilities, Sweet32 block collisions, and Electronic Codebook (ECB) visual pattern leakage.
        </p>
      </div>

      {/* Production Notice Banner */}
      <div className="p-4 border border-[#E5E5E5] bg-[#F7F7F7] rounded-lg text-xs flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[#111111]">Production Cryptography Policy</div>
          <p className="mt-0.5 text-[#666666] leading-relaxed">
            CipherVault strictly prohibits DES for encrypting user files. All images are processed with authenticated AES-256-GCM and enveloped via RSA-3072 OAEP.
          </p>
        </div>
      </div>

      {/* Segmented Control */}
      <div className="flex items-center gap-1 p-1 bg-[#F7F7F7] border border-[#E5E5E5] rounded-lg">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer text-center ${
            activeTab === 'matrix'
              ? 'bg-white text-[#111111] font-semibold shadow-xs'
              : 'text-[#666666] hover:text-[#111111]'
          }`}
        >
          Cryptographic Matrix
        </button>
        <button
          onClick={() => setActiveTab('visual_leakage')}
          className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer text-center ${
            activeTab === 'visual_leakage'
              ? 'bg-white text-[#111111] font-semibold shadow-xs'
              : 'text-[#666666] hover:text-[#111111]'
          }`}
        >
          ECB Pattern Leakage Simulator
        </button>
        <button
          onClick={() => setActiveTab('complexity')}
          className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer text-center ${
            activeTab === 'complexity'
              ? 'bg-white text-[#111111] font-semibold shadow-xs'
              : 'text-[#666666] hover:text-[#111111]'
          }`}
        >
          Keyspace & Exhaustive Search
        </button>
      </div>

      {/* Tab 1: Cryptographic Comparison Matrix */}
      {activeTab === 'matrix' && (
        <div className="border border-[#E5E5E5] bg-white rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F7F7] border-b border-[#E5E5E5] text-[#666666] uppercase font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Security Parameter</th>
                  <th className="py-3 px-4 font-semibold">DES (Obsolete)</th>
                  <th className="py-3 px-4 font-semibold">3DES (Deprecated)</th>
                  <th className="py-3 px-4 font-semibold text-[#111111]">AES-256-GCM (CipherVault)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5] text-[#111111]">
                <tr className="hover:bg-[#FAFAFA]">
                  <td className="py-3 px-4 font-semibold">Effective Key Length</td>
                  <td className="py-3 px-4 font-mono text-[#DC2626]">56 bits</td>
                  <td className="py-3 px-4 font-mono text-[#D97706]">112 bits</td>
                  <td className="py-3 px-4 font-mono text-[#16A34A] font-semibold">256 bits</td>
                </tr>
                <tr className="hover:bg-[#FAFAFA]">
                  <td className="py-3 px-4 font-semibold">Block Size</td>
                  <td className="py-3 px-4 font-mono">64 bits</td>
                  <td className="py-3 px-4 font-mono">64 bits</td>
                  <td className="py-3 px-4 font-mono font-semibold">128 bits</td>
                </tr>
                <tr className="hover:bg-[#FAFAFA]">
                  <td className="py-3 px-4 font-semibold">Authenticated Mode (AEAD)</td>
                  <td className="py-3 px-4 text-[#DC2626]">No (Vulnerable to bit flips)</td>
                  <td className="py-3 px-4 text-[#DC2626]">No</td>
                  <td className="py-3 px-4 text-[#16A34A] font-semibold">Yes (128-bit GMAC Tag)</td>
                </tr>
                <tr className="hover:bg-[#FAFAFA]">
                  <td className="py-3 px-4 font-semibold">Sweet32 Birthday Collision</td>
                  <td className="py-3 px-4 text-[#DC2626]">After 32 GB of data</td>
                  <td className="py-3 px-4 text-[#DC2626]">After 32 GB of data</td>
                  <td className="py-3 px-4 text-[#16A34A] font-semibold">After 256 Exabytes</td>
                </tr>
                <tr className="hover:bg-[#FAFAFA]">
                  <td className="py-3 px-4 font-semibold">Modern Brute-Force Cost</td>
                  <td className="py-3 px-4 text-[#DC2626] font-semibold">&lt; $25 (Cloud FPGA, &lt; 5 min)</td>
                  <td className="py-3 px-4">$10,000+</td>
                  <td className="py-3 px-4 text-[#16A34A] font-semibold">Mathematically Impossible</td>
                </tr>
                <tr className="hover:bg-[#FAFAFA]">
                  <td className="py-3 px-4 font-semibold">NIST FIPS Standard</td>
                  <td className="py-3 px-4 text-[#DC2626]">Withdrawn 2005</td>
                  <td className="py-3 px-4 text-[#D97706]">Disallowed 2023</td>
                  <td className="py-3 px-4 text-[#16A34A] font-semibold">Current FIPS 197 &amp; SP 800-38D</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Visual ECB Pattern Leakage Simulator */}
      {activeTab === 'visual_leakage' && (
        <div className="border border-[#E5E5E5] bg-white rounded-xl p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-[#111111]">
              Visualizing Electronic Codebook (ECB) Pattern Leakage
            </h2>
            <p className="text-xs text-[#666666] mt-1 leading-relaxed">
              When an image is encrypted in ECB mode (historically common with DES), identical plaintext blocks always yield identical ciphertext blocks, allowing silhouettes, contrast contours, and structural shapes to remain clearly visible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-[#E5E5E5] bg-[#F7F7F7] rounded-lg p-4 flex flex-col items-center">
              <span className="text-xs font-semibold text-[#111111] mb-3">1. Original Image</span>
              <canvas
                ref={canvasPlaintextRef}
                width={64}
                height={64}
                className="w-36 h-36 border border-[#E5E5E5] bg-white rounded shadow-xs"
                style={{ imageRendering: 'pixelated' }}
              />
              <span className="text-[11px] text-[#666666] mt-3">High contrast geometric target</span>
            </div>

            <div className="border border-[#E5E5E5] bg-[#F7F7F7] rounded-lg p-4 flex flex-col items-center">
              <span className="text-xs font-semibold text-[#DC2626] mb-3">2. Insecure ECB Mode</span>
              <canvas
                ref={canvasEcbRef}
                width={64}
                height={64}
                className="w-36 h-36 border border-[#E5E5E5] bg-white rounded shadow-xs"
                style={{ imageRendering: 'pixelated' }}
              />
              <span className="text-[11px] text-[#DC2626] font-medium mt-3">Shape silhouette remains visible</span>
            </div>

            <div className="border border-[#E5E5E5] bg-[#F7F7F7] rounded-lg p-4 flex flex-col items-center">
              <span className="text-xs font-semibold text-[#16A34A] mb-3">3. CipherVault AES-256-GCM</span>
              <canvas
                ref={canvasGcmRef}
                width={64}
                height={64}
                className="w-36 h-36 border border-[#E5E5E5] bg-white rounded shadow-xs"
                style={{ imageRendering: 'pixelated' }}
              />
              <span className="text-[11px] text-[#16A34A] font-medium mt-3">Pure uniform pseudorandom entropy</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Keyspace & Exhaustive Search */}
      {activeTab === 'complexity' && (
        <div className="border border-[#E5E5E5] bg-white rounded-xl p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-[#111111]">
              Exhaustive Keyspace Complexity
            </h2>
            <p className="text-xs text-[#666666] mt-1 leading-relaxed">
              Comparison of total possible keys between 56-bit DES and 256-bit AES.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="border border-[#E5E5E5] bg-[#F7F7F7] rounded-lg p-5 space-y-3">
              <div className="text-xs font-bold text-[#DC2626]">DES Keyspace (56 bits)</div>
              <div className="font-mono text-base font-bold text-[#111111]">
                2⁵⁶ = 72,057,594,037,927,936 keys
              </div>
              <p className="text-[#666666] leading-relaxed">
                72 quadrillion keys. In 1998, the EFF Deep Crack machine cracked a DES key in 56 hours. In 2026, cloud FPGA clusters search this full keyspace in under 5 minutes for approximately $20.
              </p>
            </div>

            <div className="border border-[#E5E5E5] bg-[#F7F7F7] rounded-lg p-5 space-y-3">
              <div className="text-xs font-bold text-[#16A34A]">AES-256 Keyspace (256 bits)</div>
              <div className="font-mono text-base font-bold text-[#111111]">
                2²⁵⁶ ≈ 1.15 × 10⁷⁷ keys
              </div>
              <p className="text-[#666666] leading-relaxed">
                More than the estimated number of atoms in the observable universe (10⁸⁰). Even with all world supercomputers combined testing a trillion keys per second, exhaustion requires billions of times the age of the universe.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
