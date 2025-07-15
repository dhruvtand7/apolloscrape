"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Search, Mail, Building, CheckCircle, XCircle, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

const ApolloContactScraper = () => {
  const [companies, setCompanies] = useState([]);
  const [currentCompanyIndex, setCurrentCompanyIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [phase, setPhase] = useState('upload'); // 'upload', 'searching', 'company-selection', 'selecting', 'complete'
  const [companyMatches, setCompanyMatches] = useState([]);
  const fileInputRef = useRef(null);
  const logContainerRef = useRef(null);
  const handleKeyDownSearch = (e) => {
    if (e.key === 'Enter') handleManualSearch();
  };

  // --- IMPORTANT ---
  // Replace with your actual Apollo API Key
  
  // -----------------

  
  const BASE_URL = "https://api.apollo.io/v1";

  // --- Styles (unchanged) ---
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    maxWidth: {
      maxWidth: '1024px',
      margin: '0 auto'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      padding: '24px',
      marginBottom: '24px'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '8px'
    },
    title: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#1e293b',
      margin: 0
    },
    subtitle: {
      color: '#64748b',
      fontSize: '16px',
      margin: 0
    },
    progressContainer: {
      marginTop: '24px'
    },
    progressText: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '14px',
      color: '#64748b',
      marginBottom: '8px'
    },
    progressBar: {
      width: '100%',
      backgroundColor: '#e2e8f0',
      borderRadius: '9999px',
      height: '8px',
      overflow: 'hidden'
    },
    progressFill: {
      backgroundColor: '#3b82f6',
      height: '100%',
      borderRadius: '9999px',
      transition: 'width 0.3s ease'
    },
    uploadArea: {
      border: '2px dashed #cbd5e1',
      borderRadius: '12px',
      padding: '48px',
      textAlign: 'center',
      backgroundColor: '#f8fafc'
    },
    uploadIcon: {
      width: '48px',
      height: '48px',
      color: '#94a3b8',
      margin: '0 auto 16px'
    },
    uploadTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '8px'
    },
    uploadSubtitle: {
      color: '#64748b',
      marginBottom: '16px'
    },
    button: {
      backgroundColor: '#3b82f6',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '500',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'background-color 0.2s'
    },
    buttonDisabled: {
      backgroundColor: '#94a3b8',
      cursor: 'not-allowed'
    },
    buttonGreen: {
      backgroundColor: '#16a34a'
    },
    buttonGray: {
      backgroundColor: '#6b7280'
    },
    searchingContainer: {
      textAlign: 'center'
    },
    searchTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '8px'
    },
    searchSubtitle: {
      color: '#64748b',
      marginBottom: '24px'
    },
    searchInputContainer: {
      display: 'flex',
      gap: '8px',
      marginBottom: '16px'
    },
    searchInput: {
      flexGrow: 1,
      fontSize: '16px',
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid #cbd5e1'
    },
    companyCard: {
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      backgroundColor: 'white'
    },
     companyCardHover: {
      backgroundColor: '#f8fafc',
      borderColor: '#3b82f6'
    },
    companyName: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1e293b'
    },
    contactCard: {
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '12px',
      backgroundColor: 'white'
    },
    contactHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    contactName: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1e293b'
    },
    contactTitle: {
      color: '#64748b',
      marginBottom: '8px'
    },
    contactDetails: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '16px',
      fontSize: '14px',
      color: '#64748b'
    },
    contactDetail: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    logContainer: {
      maxHeight: '300px',
      overflowY: 'auto',
      padding: '8px',
      backgroundColor: '#f1f5f9',
      borderRadius: '8px'
    },
    logItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
      fontSize: '14px',
      marginBottom: '8px',
      fontFamily: 'monospace'
    },
    logTimestamp: {
      color: '#94a3b8'
    },
    spinner: {
      width: '20px',
      height: '20px',
      border: '2px solid #ffffff',
      borderTop: '2px solid transparent',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    },
    completeContainer: {
      textAlign: 'center'
    },
    completeIcon: {
      width: '64px',
      height: '64px',
      color: '#16a34a',
      margin: '0 auto 16px'
    },
    completeTitle: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '8px'
    },
    buttonGroup: {
      display: 'flex',
      gap: '16px',
      justifyContent: 'center'
    },
    sectionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px'
    },
    sectionTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#1e293b'
    },
  };

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // *FIX APPLIED HERE*
  // This useEffect hook will run when the 'companies' state changes.
  useEffect(() => {
    // We only want to start the process if companies have been loaded
    // and we are still in the initial 'upload' phase.
    if (companies.length > 0 && phase === 'upload') {
        processNextCompany(0);
    }
  }, [companies, phase]); // Dependency array ensures this runs when these states change

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const processNextCompany = (index) => {
    if (index >= companies.length) {
      addLog(`🎉 All companies processed! Moving to complete phase.`, 'success');
      setPhase('complete');
      setIsLoading(false);
      return;
    }
    const company = companies[index];
    addLog(`➡ Preparing to search for company ${index + 1}/${companies.length}: "${company}"`, 'info');
    setCurrentCompanyIndex(index);
    setSearchQuery(company);
    setPhase('searching');
    setCompanyMatches([]);
    setContacts([]);
    setIsLoading(false);
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
      
      // FIXED: Added null checks and defensive programming
      const orgMatches = (data.organizations || [])
      .filter(org => org && org.id)
      .map(org => ({
        id: org.id,
        name: org.name || 'Unknown Company',
        website_url: org.website_url || null,
        city: org.city || null,
        country: org.country || null,
        estimated_num_employees: org.organization_headcount_twelve_month_growth || null  // or whatever metric makes sense
      }));

      if (orgMatches.length > 0) {
        addLog(`🏢 Found ${orgMatches.length} autocomplete matches.`, 'info');
        setCompanyMatches(orgMatches);
        setPhase('company-selection');
      } else {
            addLog(`❌ No matches found for "${searchQuery}". Try a different name or skip.`, 'error');
          }
        } catch (error) {
          addLog(`❌ Error during autocomplete search: ${error.message}`, 'error');
        } finally {
          setIsLoading(false);
        }
      };

  const findAllContacts = async (orgId, domain) => {
  addLog(`👥 Searching for contacts in organization: ${orgId}`, 'info');
  setIsLoading(true);
  setPhase('selecting'); // Move to selecting phase to show loading state

  try {
    // ⬇ *MODIFICATION 1: SIMPLIFIED URL*
    // Point to your own backend route. All complex parameters are now on the server.
    const url = `/api/apollo?orgId=${orgId}&domain=${encodeURIComponent(domain)}`;
    addLog(`📡 Frontend Request: ${url}`, 'info');

    // ⬇ *MODIFICATION 2: SIMPLIFIED FETCH*
    // No headers are needed. The API key is handled securely on the server.
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      // Use the structured error message from your backend route
      throw new Error(`API Error: ${response.status} - ${errorData.error}`);
    }

    const data = await response.json();
    const people = data.people || [];
    addLog(`✅ Found ${people.length} total contacts.`, 'success');

    // ⬇ *MODIFICATION 3: NO LOOP NEEDED*
    // The backend now fetches all relevant contacts in one go.
    // FIXED: Added null checks for contact processing
    const processedContacts = people
      .filter(p => p && p.id) // Filter out null/undefined people
      .map(p => ({
        id: p.id,
        companyName: (p.organization && p.organization.name) || companies[currentCompanyIndex] || 'Unknown Company',
        name: p.name || 'Unknown Name',
        email: p.email || null,
        title: p.title || 'Unknown Title',
        linkedin: p.linkedin_url || null
      }));

    setContacts(processedContacts);

    if (processedContacts.length === 0) {
      addLog(`⚠ No relevant contacts found for this company.`, 'warning');
    }

  } catch (error) {
    addLog(`❌ Error fetching contacts: ${error.message}`, 'error');
  } finally {
    setIsLoading(false);
  }
};
  
  const selectCompany = (orgId) => {
    const selectedOrg = companyMatches.find(org => org.id === orgId);
    if (selectedOrg) {
      addLog(`✅ Company selected: "${selectedOrg.name}" (ID: ${orgId})`, 'success');
      setCompanyMatches([]);
      findAllContacts(orgId, selectedOrg.website_url?.replace(/^https?:\/\//, '') || '');

    } else {
      addLog(`❌ Error: Could not find selected company`, 'error');
    }
  };

  const selectContact = async (contact) => {
    addLog(`🔍 Requesting phone for ${contact.name}...`, 'info');
    setIsLoading(true);

    try {
      const url = `/api/apollo?personId=${contact.id}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      addLog(`📬 Phone request submitted. Waiting for webhook...`, 'info');

      // Poll webhook result for 10 seconds max
      let phoneNumber = null;
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 1000));

        const check = await fetch(`/api/apollowebhook?personId=${contact.id}`);
        if (check.ok) {
          const data = await check.json();
          phoneNumber = data.phone;
          break;
        }
      }

      if (!phoneNumber) {
        addLog(`📞 Phone not available yet for ${contact.name}`, 'warning');
      } else {
        addLog(`📞 Phone found: ${phoneNumber}`, 'success');
      }

      const finalContact = {
        'Company Name': contact.companyName,
        'Employee Name': contact.name,
        'Email': contact.email || 'N/A',
        'Phone No': phoneNumber || 'N/A',
        'Designation': contact.title,
        'LinkedIn': contact.linkedin || 'N/A'
      };

      setSelectedContacts(prev => [...prev, finalContact]);
      addLog(`👍 Added ${contact.name} to selected list.`, 'success');
      processNextCompany(currentCompanyIndex + 1);

    } catch (error) {
      addLog(`❌ Error: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const removeSelectedContact = (index) => {
    setSelectedContacts(prev => prev.filter((_, i) => i !== index));
    addLog(`🗑 Removed contact at index ${index}.`, 'warning');
  };

  const goToCompany = (index) => {
    if (index >= 0 && index < companies.length) {
      addLog(`🔁 Revisiting company ${index + 1}: ${companies[index]}`, 'info');
      processNextCompany(index);
    }
  };

  const skipCompany = () => {
    addLog(`⏭ Skipped: ${companies[currentCompanyIndex]}`, 'warning');
    processNextCompany(currentCompanyIndex + 1);
  };

  // *FIX APPLIED HERE*
  // The call to processNextCompany is removed from this function.
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    addLog(`📁 Processing file: ${file.name}`, 'info');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" }); // Use defval to avoid null/undefined
        
        addLog(`📊 Parsed ${jsonData.length} rows from file`, 'info');
        
        const companyList = [...new Set(jsonData.map(row => (row.Company || '').toString().trim()).filter(Boolean))];
        
        if (companyList.length > 0) {
            addLog(`📁 Loaded ${companyList.length} unique companies.`, 'success');
            // This now triggers the useEffect hook by updating state
            setCompanies(companyList); 
        } else {
            addLog(`❌ No companies found in the 'Company' column of the uploaded file.`, 'error');
            setPhase('upload');
        }
      } catch (error) {
        addLog(`❌ Error reading file: ${error.message}`, 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadExcel = () => {
    if (selectedContacts.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(selectedContacts);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts');
    const filename = `apollo_contacts_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
    addLog(`📊 Downloaded ${selectedContacts.length} contacts.`, 'success');
  };

  const resetApp = () => {
    setCompanies([]);
    setCurrentCompanyIndex(0);
    setSearchQuery('');
    setContacts([]);
    setSelectedContacts([]);
    setLogs([]);
    setPhase('upload');
    setIsLoading(false);
    setCompanyMatches([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    addLog(`🔄 Application reset.`);
  };

  const getLogIcon = (type) => {
    const iconProps = { style: { width: '16px', height: '16px', marginTop: '2px', flexShrink: 0 } };
    switch (type) {
      case 'success': return <CheckCircle {...iconProps} style={{...iconProps.style, color: '#16a34a'}} />;
      case 'error': return <XCircle {...iconProps} style={{...iconProps.style, color: '#dc2626'}} />;
      case 'warning': return <AlertCircle {...iconProps} style={{...iconProps.style, color: '#d97706'}} />;
      default: return <AlertCircle {...iconProps} style={{...iconProps.style, color: '#3b82f6'}} />;
    }
  };
  
  const Spinner = () => <div style={styles.spinner}></div>;

  return (
    <div style={styles.container}>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      
      <div style={styles.maxWidth}>
        
        {/* Header */}
        <div style={styles.card}>
          <div style={styles.header}>
            <Building style={{ width: '32px', height: '32px', color: '#3b82f6' }} />
            <h1 style={styles.title}>Apollo Contact Scraper</h1>
          </div>
          <p style={styles.subtitle}>Upload a file, manually search for each company, and select contacts to export.</p>
          
          {companies.length > 0 && phase !== 'complete' && (
            <div style={styles.progressContainer}>
              <div style={styles.progressText}>
                <span>Progress: Company {currentCompanyIndex + 1} of {companies.length}</span>
                <span>{selectedContacts.length} contacts selected</span>
              </div>
              <div style={styles.progressBar}>
                <div style={{...styles.progressFill, width: `${(currentCompanyIndex / companies.length) * 100}%`}} />
              </div>
            </div>
          )}
        </div>

        {/* --- Main Content Area --- */}

        {/* Phase: Upload */}
        {phase === 'upload' && (
          <div style={styles.card}>
            <div style={styles.uploadArea}>
              <Upload style={styles.uploadIcon} />
              <h3 style={styles.uploadTitle}>1. Upload Company List</h3>
              <p style={styles.uploadSubtitle}>Select a CSV or XLSX file with a "Company" column.</p>
              <input ref={fileInputRef} type="file" accept=".csv, .xlsx" onChange={handleFileUpload} style={{ display: 'none' }} />
              <button onClick={() => fileInputRef.current?.click()} style={styles.button}>Choose File</button>
            </div>
             
          </div>
        )}

        {/* Phase: Searching */}
        {phase === 'searching' && (
          <div style={styles.card}>
            <h3 style={styles.searchTitle}>2. Search for Company</h3>
            <p style={styles.searchSubtitle}>
              Now searching for: <strong>{companies[currentCompanyIndex]}</strong>. You may edit the name.
            </p>
            <div style={styles.searchInputContainer}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDownSearch}
                style={styles.searchInput}
                placeholder="Enter company name to search"
              />
              <button onClick={handleManualSearch} disabled={isLoading} style={{...styles.button, ...styles.buttonGreen}}>
                {isLoading ? <Spinner /> : <Search style={{ width: '20px', height: '20px' }} />}
                Search
              </button>
            </div>
            <button onClick={skipCompany} disabled={isLoading} style={{...styles.button, ...styles.buttonGray, marginLeft: '8px'}}>Skip Company</button>
          </div>
        )}

        {/* Phase: Company Selection */}
        {phase === 'company-selection' && (
            <div style={styles.card}>
              <div style={styles.sectionHeader}>
                  <h3 style={styles.sectionTitle}>3. Select the Correct Company</h3>
                  <button onClick={() => setPhase('searching')} style={{...styles.button, ...styles.buttonGray}}>Back to Search</button>
              </div>
              <div>
                {companyMatches.map((company) => (
                  <div key={company.id} style={styles.companyCard} onClick={() => !isLoading && selectCompany(company.id)}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                          <div>
                              <h4 style={styles.companyName}>{company.name}</h4>
                              <p style={{fontSize: '14px', color: '#64748b', margin: '4px 0'}}>
                                  {company.website_url || 'No website'} | {company.city || 'No city'}, {company.country || ''} | {company.estimated_num_employees || '?'} employees
                              </p>
                          </div>
                          <button style={styles.button}>Select</button>
                      </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        {companies.length > 0 && (
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>Company Navigation</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {companies.map((c, i) => (
                <button
                  key={i}
                  onClick={() => goToCompany(i)}
                  style={{...styles.button, padding: '4px 12px', fontSize: '14px', backgroundColor: i === currentCompanyIndex ? '#2563eb' : '#6b7280'}}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Contacts Summary with Remove option */}
        {selectedContacts.length > 0 && (
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>Selected Contacts ({selectedContacts.length})</h3>
            <div style={{maxHeight: '200px', overflowY: 'auto'}}>
              {selectedContacts.map((contact, index) => (
                <div key={index} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9'}}>
                  <div>
                    <span style={{fontWeight: '500'}}>{contact['Employee Name']}</span>
                    <span style={{color: '#64748b', marginLeft: '8px'}}>({contact['Designation']})</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <span style={{fontSize: '14px', color: '#64748b'}}>{contact['Company Name']}</span>
                    <Trash2 size={16} style={{cursor: 'pointer'}} onClick={() => removeSelectedContact(index)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Phase: Contact Selection */}
        {phase === 'selecting' && (
          <div style={styles.card}>
             <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>4. Select a Contact</h3>
                <button onClick={skipCompany} disabled={isLoading} style={{...styles.button, ...styles.buttonGray}}>Skip Company</button>
            </div>
            {isLoading && contacts.length === 0 ? (
                <div style={{textAlign: 'center', padding: '48px'}}>
                    <Spinner/>
                    <p style={{color: '#64748b'}}>Searching for contacts...</p>
                </div>
            ) : contacts.length > 0 ? (
              <div>
                {contacts.map((contact) => (
                  <div key={contact.id} style={styles.contactCard}>
                    <div style={styles.contactHeader}>
                        <div style={{flex: 1}}>
                            <h4 style={styles.contactName}>{contact.name}</h4>
                            <p style={styles.contactTitle}>{contact.title}</p>
                            <div style={styles.contactDetails}>
                                {contact.email && <div style={styles.contactDetail}><Mail size={14}/> {contact.email}</div>}
                            </div>
                        </div>
                      <button onClick={() => selectContact(contact)} style={styles.button}>Select & Fetch Phone</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
                <div style={{textAlign: 'center', padding: '32px', backgroundColor: '#f8fafc', borderRadius: '8px'}}>
                    <p style={{color: '#64748b'}}>No relevant contacts were found for this company.</p>
                </div>
            )}
          </div>
        )}

        {/* Phase: Complete */}
        {phase === 'complete' && (
          <div style={styles.card}>
            <div style={styles.completeContainer}>
              <CheckCircle style={styles.completeIcon} />
              <h3 style={styles.completeTitle}>Process Complete!</h3>
              <p style={styles.subtitle}>
                You selected {selectedContacts.length} contacts from {companies.length} companies.
              </p>
              <div style={{...styles.buttonGroup, marginTop: '24px'}}>
                <button onClick={downloadExcel} disabled={selectedContacts.length === 0} style={{...styles.button, ...styles.buttonGreen, ...(selectedContacts.length === 0 ? styles.buttonDisabled : {})}}>
                  <Download size={20} /> Download Excel
                </button>
                <button onClick={resetApp} style={{...styles.button, ...styles.buttonGray}}>
                  <RefreshCw size={20} /> Start Over
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Selected Contacts Summary */}
        {selectedContacts.length > 0 && (
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>Selected Contacts ({selectedContacts.length})</h3>
            <div style={{maxHeight: '200px', overflowY: 'auto'}}>
              {selectedContacts.map((contact, index) => (
                <div key={index} style={{display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9'}}>
                  <div>
                    <span style={{fontWeight: '500'}}>{contact['Employee Name']}</span>
                    <span style={{color: '#64748b', marginLeft: '8px'}}>({contact['Designation']})</span>
                  </div>
                  <span style={{fontSize: '14px', color: '#64748b'}}>{contact['Company Name']}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Log */}
        {logs.length > 0 && (
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>Activity Log</h3>
            <div ref={logContainerRef} style={styles.logContainer}>
              {logs.map((log, index) => (
                <div key={index} style={styles.logItem}>
                  {getLogIcon(log.type)}
                  <div>
                    <span style={styles.logTimestamp}>[{log.timestamp}]</span>
                    <span style={{marginLeft: '8px'}}>{log.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApolloContactScraper;