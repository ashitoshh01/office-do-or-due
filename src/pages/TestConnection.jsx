import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, limit, query } from 'firebase/firestore';

export default function TestConnection() {
    const [logs, setLogs] = useState([]);
    const [status, setStatus] = useState('idle');

    const addLog = (msg, type = 'info') => {
        setLogs(prev => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);
    };

    const runDiagnostics = async () => {
        setLogs([]);
        setStatus('running');
        addLog('Starting Diagnostics...', 'info');

        try {
            // 1. Test Public Company Write (usually open in these rules)
            addLog('Test 1: Attempting write to "companies"...', 'info');
            try {
                await addDoc(collection(db, 'companies'), {
                    test: true,
                    timestamp: new Date().toISOString()
                });
                addLog('✅ Success: Can write to "companies"', 'success');
            } catch (e) {
                addLog(`❌ Failed: Cannot write to "companies". Error: ${e.message}`, 'error');
            }

            // 2. Test Join Request Write (The problematic one)
            addLog('Test 2: Attempting write to "joinRequests"...', 'info');
            try {
                await addDoc(collection(db, 'joinRequests'), {
                    name: "Diagnostic Test",
                    email: "test@example.com",
                    roleRequested: "TEST",
                    companySlug: "test",
                    status: "PENDING",
                    createdAt: new Date().toISOString()
                });
                addLog('✅ Success: Can write to "joinRequests"', 'success');
            } catch (e) {
                addLog(`❌ Failed: Cannot write to "joinRequests". Error: ${e.message}`, 'error');
                addLog('⚠️ DIAGNOSIS: The Firestore Rules for "joinRequests" are NOT deployed or are incorrect.', 'warning');
            }

        } catch (error) {
            addLog(`Critical Error: ${error.message}`, 'error');
        } finally {
            setStatus('done');
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Firestore Connectivity Diagnostics</h1>

            <button
                onClick={runDiagnostics}
                disabled={status === 'running'}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
                {status === 'running' ? 'Running Tests...' : 'Run Diagnostics'}
            </button>

            <div className="mt-8 bg-slate-900 rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto">
                {logs.length === 0 ? (
                    <div className="text-slate-500">Ready to run tests...</div>
                ) : (
                    logs.map((log, i) => (
                        <div key={i} className={`mb-1 ${log.type === 'error' ? 'text-red-400' :
                                log.type === 'success' ? 'text-green-400' :
                                    log.type === 'warning' ? 'text-yellow-400' : 'text-slate-300'
                            }`}>
                            <span className="text-slate-500 mr-2">[{log.time}]</span>
                            {log.msg}
                        </div>
                    ))
                )}
            </div>

            <div className="mt-6 bg-yellow-50 border border-yellow-200 p-4 rounded text-sm text-yellow-800">
                <strong>Correct Rules Check:</strong><br />
                Your Firestore rules in Firebase Console must include:<br />
                <code className="block bg-yellow-100 p-2 mt-1 rounded">
                    match /joinRequests/&#123;requestId&#125; &#123;<br />
                    &nbsp;&nbsp;allow create: if true;<br />
                    &#125;
                </code>
            </div>
        </div>
    );
}
