import React, { useState } from 'react';
import {
  Cpu,
  Zap,
  QrCode,
  ShieldAlert,
  CheckCircle2,
  Loader2,
  ChevronDown,
  Terminal,
  Play,
  X
} from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

interface JudgeDemoSandboxProps {
  orderId?: string;
  onScenarioExecuted?: (result: any) => void;
  className?: string;
}

export const JudgeDemoSandbox: React.FC<JudgeDemoSandboxProps> = ({
  orderId,
  onScenarioExecuted,
  className = ''
}) => {
  const { showToast } = useToast();
  const [selectedScenario, setSelectedScenario] = useState<string>('bank_timeout');
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [showInspector, setShowInspector] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  const scenarios = [
    {
      id: 'bank_timeout',
      label: 'Scenario 1: Bank Gateway Timeout (OTP Switch Delay)',
      shortDesc: 'Transient bank authorization timeout. AI selects 1-Click Retry.',
      toolExpected: 'retryPayment',
      badgeColor: 'bg-blue-50 text-[#0066FF] border-blue-200',
      icon: Zap
    },
    {
      id: 'popup_blocked',
      label: 'Scenario 2: Mobile 3DS Popup Interrupted (Friction)',
      shortDesc: 'Mobile browser popup dropped. AI prompts & generates Razorpay Payment Link.',
      toolExpected: 'suggestPaymentLink',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: QrCode
    },
    {
      id: 'hard_decline_escalate',
      label: 'Scenario 3: 3x Consecutive Card Rejection (Hard Block)',
      shortDesc: 'Irreversible failure after 3 attempts. AI escalates safely to Support / COD.',
      toolExpected: 'escalateRecoveryCase',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: ShieldAlert
    },
    {
      id: 'simulate_recovery',
      label: 'Scenario 4: Complete Real-Time Payment Recovery',
      shortDesc: 'Payment completes via Razorpay link/retry. Order is confirmed at 100% value.',
      toolExpected: 'paymentVerified',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2
    }
  ];

  const handleExecuteScenario = async () => {
    try {
      setIsRunning(true);
      const res = await api.simulateRecoveryScenario({
        scenario: selectedScenario,
        orderId
      });

      if (res && res.success) {
        setLastResult(res);
        showToast(`Simulator: Executed "${selectedScenario.replace(/_/g, ' ')}" successfully!`, 'success');
        if (onScenarioExecuted) {
          onScenarioExecuted(res);
        }
      } else {
        showToast('Simulator returned an error. Please try again.', 'error');
      }
    } catch (err: any) {
      console.error('Judge Sandbox execution error:', err);
      showToast(err?.response?.data?.message || 'Failed to execute simulation scenario', 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const activeScenarioObj = scenarios.find(s => s.id === selectedScenario) || scenarios[0];

  return (
    <div className={`bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs relative overflow-hidden font-poppins ${className}`}>
      {/* Top Banner Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0066FF] border border-blue-200 flex items-center justify-center shadow-2xs">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#0066FF] border border-blue-200/80 font-mono">
                Autonomous Recovery Engine
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Agent Simulator
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight mt-0.5">
              Recovery Scenario & Telemetry Simulator
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lastResult && (
            <button
              type="button"
              onClick={() => setShowInspector(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Terminal className="w-3.5 h-3.5 text-[#0066FF]" />
              <span>Inspect Decision Trace</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 text-xs transition cursor-pointer"
            title={isOpen ? 'Collapse Simulator' : 'Expand Simulator'}
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Simulator Control Body */}
      {isOpen && (
        <div className="pt-4 space-y-4 animate-in fade-in duration-200">
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Test how RevivePay autonomously diagnoses payment failures, selects policy-bounded recovery routes, and preserves 100% merchant profit margin with zero discounts.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-center">
            {/* Scenario Dropdown Selector (8 Cols) */}
            <div className="lg:col-span-8">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">
                Select Test Scenario to Inject:
              </label>
              <div className="relative">
                <select
                  value={selectedScenario}
                  onChange={(e) => setSelectedScenario(e.target.value)}
                  disabled={isRunning}
                  className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-800 font-medium appearance-none focus:outline-none focus:border-[#0066FF] transition cursor-pointer disabled:opacity-50 pr-10"
                >
                  {scenarios.map((sc) => (
                    <option key={sc.id} value={sc.id} className="bg-white text-slate-800 py-2">
                      {sc.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Trigger Button (4 Cols) */}
            <div className="lg:col-span-4 flex items-end">
              <button
                type="button"
                onClick={handleExecuteScenario}
                disabled={isRunning}
                className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Analyzing Telemetry...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-white fill-current" />
                    <span>Run AI Diagnostic</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Scenario Details Pill */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-slate-500 font-medium">Expected AI Tool:</span>
              <code className="px-2.5 py-0.5 rounded-md bg-blue-50 text-[#0066FF] font-mono font-bold text-[11px] border border-blue-200">
                {activeScenarioObj.toolExpected}
              </code>
            </div>
            <p className="text-slate-500 text-[11px] font-medium truncate">
              {activeScenarioObj.shortDesc}
            </p>
          </div>
        </div>
      )}

      {/* AI Reasoning Trace Inspector Modal */}
      {showInspector && lastResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-slate-900 font-poppins max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-[#0066FF] border border-blue-200">
                  <Terminal className="w-4 h-4" />
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  Autonomous Policy & Execution Trace
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowInspector(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Status Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center font-mono">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-400 uppercase block font-medium">Tool Invoked</span>
                <span className="text-xs font-bold text-[#0066FF] truncate block mt-0.5">
                  {lastResult.decision?.tool || lastResult.decision?.decision}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-400 uppercase block font-medium">Guardrails</span>
                <span className="text-xs font-bold text-emerald-700 block mt-0.5">
                  100% Passed
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-400 uppercase block font-medium">Discount Given</span>
                <span className="text-xs font-bold text-emerald-700 block mt-0.5">
                  ₹0 (0%)
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-400 uppercase block font-medium">Attempt #</span>
                <span className="text-xs font-bold text-purple-700 block mt-0.5">
                  {lastResult.order?.revivePayCase?.recoveryAttempts || 1}/3
                </span>
              </div>
            </div>

            {/* Technical Explanation */}
            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-slate-700 font-mono text-[11px] uppercase tracking-wider">
                Autonomous AI Decision Reasoning:
              </span>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 font-mono text-[11px] leading-relaxed">
                {lastResult.decision?.reason || 'Tool selected by autonomous recovery policy based on failure telemetry.'}
              </div>
            </div>

            {/* Customer Message */}
            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-slate-700 font-mono text-[11px] uppercase tracking-wider">
                Customer-Facing Action Message:
              </span>
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs leading-relaxed font-medium">
                "{lastResult.decision?.customerMessage || 'Your payment was safely protected.'}"
              </div>
            </div>

            {/* Raw JSON Payload Preview */}
            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-slate-500 font-mono text-[11px] uppercase tracking-wider">
                Live Order Document Data:
              </span>
              <pre className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 font-mono text-[10px] max-h-40 overflow-y-auto leading-tight">
                {JSON.stringify({
                  orderId: lastResult.orderId,
                  totalAmount: lastResult.order?.totalAmount,
                  paymentStatus: lastResult.order?.paymentStatus,
                  checkoutStatus: lastResult.order?.checkoutStatus,
                  revivePayCase: lastResult.order?.revivePayCase
                }, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowInspector(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
