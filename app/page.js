"use client";

import React, { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import {
  Upload, Download, Search, Building, CheckCircle, XCircle,
  AlertCircle, RefreshCw, Trash2, ExternalLink
} from 'lucide-react';

const ApolloCompanyMatcher = () => {
  const [companies, setCompanies] = useState([]);
  const [currentCompanyIndex, setCurrentCompanyIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [phase, setPhase] = useState('upload');
  const [companyMatches, setCompanyMatches] = useState([]);
  const fileInputRef = useRef(null);
  const logContainerRef = useRef(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    if (companies.length > 0 && phase === 'upload') {
      processNextCompany(0);
    }
  }, [companies, phase]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const processNextCompany = (index) => {
    if (index >= companies.length) {
      addLog(`🎉 All companies processed! Found ${selectedCompanies.length} matches.`, 'success');
      setPhase('complete');
      setIsLoading(false);
      return;
    }
    const company = companies[index];
    addLog(`➡ Processing company ${index + 1}/${companies.length}: "${company}"`, 'info');
    setCurrentCompanyIndex(index);
    setSearchQuery(company);
    setPhase('searching');
    setCompanyMatches([]);
    setIsLoading(false);
  };

  const handleKeyDownSearch = (e) => {
    if (e.key === 'Enter') handleManualSearch();
  };

  const handleManualSearch = async () => {
    if (!searchQuery.trim()) {
      addLog('⚠ Please enter a company name to search.', 'warning');
      return;
    }

    setIsLoading(true);
    setCompanyMatches([]);
    addLog(`🔍 Searching for companies matching: "${searchQuery}"`, 'info');

    try {
      const url = `/api/apollo?q=${encodeURIComponent(searchQuery)}`;
      addLog(`📡 API Request: ${url}`, 'info');

      const response = await fetch(url);
      addLog(`📊 API Response Status: ${response.status} ${response.statusText}`, 'info');

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const organizations = data.organizations || data.mixed_companies || [];

      const orgMatches = organizations
        .filter(org => org && org.id)
        .map(org => ({
          id: org.id,
          name: org.name || 'Unknown Company',
          website_url: org.website_url || null,
          linkedin_url: org.linkedin_url || null,
          city: org.city || null,
          state: org.state || null,
          country: org.country || null,
          industry: org.industry || null,
          estimated_num_employees: org.estimated_num_employees || 'N/A',
          annual_revenue: org.annual_revenue || null
        }));

      if (orgMatches.length > 0) {
        addLog(`🏢 Found ${orgMatches.length} company matches.`, 'info');
        setCompanyMatches(orgMatches);
        setPhase('company-selection');
      } else {
        addLog(`❌ No matches found for "${searchQuery}".`, 'error');
      }
    } catch (error) {
      addLog(`❌ Error during company search: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    addLog(`📁 Processing file: ${file.name}`, 'info');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;
        const names = rows.map(r => r['Company Name']?.trim()).filter(Boolean);
        if (!names.length) {
          addLog('⚠️ No valid company names found in "Company" column.', 'warning');
          return;
        }
        addLog(`📊 Loaded ${names.length} companies from file`, 'success');
        setCompanies(names);
      },
      error: (err) => {
        addLog(`❌ CSV parse error: ${err.message}`, 'error');
      }
    });
  };

  const selectCompany = (company) => {
    const companyData = {
      'Original Name': companies[currentCompanyIndex],
      'Apollo Name': company.name,
      'Website': company.website_url || 'N/A',
      'LinkedIn': company.linkedin_url || 'N/A',
      'Location': [company.city, company.state, company.country].filter(Boolean).join(', ') || 'N/A',
      'Industry': company.industry || 'N/A',
      'Employees': company.estimated_num_employees || 'N/A',
      'Revenue': company.annual_revenue || 'N/A'
    };
    setSelectedCompanies(prev => [...prev, companyData]);
    addLog(`✅ Selected: "${company.name}" for "${companies[currentCompanyIndex]}"`, 'success');
    processNextCompany(currentCompanyIndex + 1);
  };

  const downloadExcel = () => {
    if (!selectedCompanies.length) return;
    const headers = Object.keys(selectedCompanies[0]);
    const csv = [headers.join(','), ...selectedCompanies.map(row =>
      headers.map(h => `"${row[h] || ''}"`).join(',')
    )].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `apollo_companies_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    addLog(`📊 Downloaded ${selectedCompanies.length} companies as CSV.`, 'success');
  };

  const skipCompany = () => {
    addLog(`⏭ Skipped: ${companies[currentCompanyIndex]}`, 'warning');
    processNextCompany(currentCompanyIndex + 1);
  };

  const resetApp = () => {
    setCompanies([]); setSelectedCompanies([]); setLogs([]);
    setPhase('upload'); setCurrentCompanyIndex(0); setSearchQuery('');
    setIsLoading(false); setCompanyMatches([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    addLog(`🔄 Application reset.`);
  };

  const Spinner = () => (
    <div style={{
      width: 20, height: 20, border: '2px solid white',
      borderTop: '2px solid transparent', borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
  );

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      <h1>Apollo Company Matcher</h1>

      {phase === 'upload' && (
        <div>
          <p>Upload CSV with a "Company" column:</p>
          <input type="file" ref={fileInputRef} accept=".csv" onChange={handleFileUpload} />
        </div>
      )}

      {(phase === 'searching' || phase === 'company-selection') && (
        <div style={{ marginTop: 20 }}>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDownSearch}
            placeholder="Search or edit company name"
            style={{ padding: 8, width: '60%', marginRight: 8 }}
          />
          <button onClick={handleManualSearch} disabled={isLoading}>
            {isLoading ? <Spinner /> : 'Search'}
          </button>
          <button onClick={skipCompany} disabled={isLoading} style={{ marginLeft: 8 }}>
            Skip
          </button>
        </div>
      )}

      {phase === 'company-selection' && (
        <div style={{ marginTop: 20 }}>
          <h3>Select the correct company:</h3>
          {companyMatches.map((c) => (
            <div key={c.id} style={{ border: '1px solid #ddd', padding: 10, marginBottom: 10 }}>
              <strong>{c.name}</strong> — {c.industry || 'Unknown'}<br />
              📍 {c.city || 'N/A'}, {c.country || ''}<br />
              👥 Employees: {c.estimated_num_employees || 'N/A'}<br />
              🌐 {c.website_url}
              <div>
                <button onClick={() => selectCompany(c)} style={{ marginTop: 5 }}>Select</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {phase === 'complete' && (
        <div>
          <h3>🎉 All companies processed!</h3>
          <button onClick={downloadExcel}>Download CSV</button>
          <button onClick={resetApp} style={{ marginLeft: 8 }}>Reset</button>
        </div>
      )}

      <div style={{ marginTop: 30 }}>
        <h4>Activity Log:</h4>
        <div style={{ maxHeight: 200, overflowY: 'auto', background: '#f8f8f8', padding: 10 }}>
          {logs.map((log, i) => (
            <div key={i}>[{log.timestamp}] {log.message}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ApolloCompanyMatcher;
