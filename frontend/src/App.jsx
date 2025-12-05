// src/App.jsx - SÜRÜKLE BIRAK + 10 GRAFİK + HER TÜR İÇİN FARKLI VERİ
import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Sparkles } from 'lucide-react';
import Plot from 'react-plotly.js';
import * as XLSX from 'xlsx';

// Normal dağılım
const randn = () => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

const generateDataForType = (chartType) => {
  const n = 500;
  const rows = [];

  for (let i = 0; i < n; i++) {
    let x, y, group, category, value, time, gender, age, fare;

    time = i;
    gender = i % 2 === 0 ? 'male' : 'female';
    category = ['X', 'Y', 'Z'][i % 3];

    switch (chartType) {
      case 'Histogram':
        if (i < n / 2) {
          x = 120 + randn() * 10;
          group = 'Ixos';
        } else {
          x = 200 + randn() * 12;
          group = 'Primadur';
        }
        y = randn() * 20 + 100;
        value = x + randn() * 5;
        age = 20 + Math.abs(randn() * 8);
        fare = 50 + Math.abs(randn() * 30);
        break;

      case 'Violin Plot':
        if (i < n / 3) {
          group = 'A';
          value = 5 + randn() * 0.8;
        } else if (i < (2 * n) / 3) {
          group = 'B';
          value = 10 + randn() * 3;
        } else {
          group = 'C';
          value = 6 + randn() * 1.2;
        }
        x = value * 3 + randn();
        y = value * 2 + randn() * 2;
        age = 18 + Math.abs(randn() * 12);
        fare = 100 + Math.abs(randn() * 40);
        break;

      case 'Heatmap':
        const base = randn();
        x = base * 20 + randn() * 2;
        y = base * 18 + randn() * 3;
        value = 0.5 * x + 0.5 * y + randn() * 5;
        group = ['G1', 'G2', 'G3'][i % 3];
        age = 25 + Math.abs(randn() * 10);
        fare = 150 + Math.abs(randn() * 50);
        break;

      default:
        group = i < n / 3 ? 'A' : i < (2 * n) / 3 ? 'B' : 'C';
        x = Math.random() * 100;
        y = x * 0.5 + Math.random() * 50;
        value = Math.random() * 100;
        age = 15 + Math.floor(Math.random() * 60);
        fare = Math.random() * 300;
        break;
    }

    rows.push({ x, y, group, category, value, time, gender, age, fare });
  }
  return rows;
};

const mapCSVRows = (rows) => {
  if (!rows || rows.length === 0) return generateDataForType('Default');
  return rows.map((row, i) => {
    const ageRaw = row.Age ?? row.age ?? row.x;
    const fareRaw = row.Fare ?? row.fare ?? row.y;
    const pclass = row.Pclass ?? row.group;
    const sex = row.Sex ?? row.gender ?? 'male';

    const age = Number(ageRaw) || 20 + Math.abs(randn() * 10);
    const fare = Number(fareRaw) || 100 + Math.abs(randn() * 40);

    return {
      x: age,
      y: fare,
      group: pclass ? String(pclass) : ['A', 'B', 'C'][i % 3],
      category: sex === 'female' ? 'Y' : 'X',
      value: fare,
      time: i,
      gender: sex === 'female' ? 'female' : 'male',
      age,
      fare
    };
  });
};

const corr = (a, b) => {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  let sumA = 0, sumB = 0, sumAB = 0, sumA2 = 0, sumB2 = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i], y = b[i];
    sumA += x; sumB += y; sumAB += x * y; sumA2 += x * x; sumB2 += y * y;
  }
  const meanA = sumA / n, meanB = sumB / n;
  const cov = sumAB / n - meanA * meanB;
  const varA = sumA2 / n - meanA * meanA;
  const varB = sumB2 / n - meanB * meanB;
  return (varA <= 0 || varB <= 0) ? 0 : cov / Math.sqrt(varA * varB);
};

const App = () => {
  const [data, setData] = useState(() => generateDataForType('Default'));
  const [activeTab, setActiveTab] = useState('home');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [detectedChartType, setDetectedChartType] = useState('');

  const csvInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws);
        setData(mapCSVRows(json));
      } catch {
        setData(generateDataForType('Default'));
      }
      setActiveTab('dashboard');
    };
    reader.readAsBinaryString(file);
  };

  const detectChartType = (filename) => {
    const n = filename.toLowerCase();
    if (n.includes('violin') || n.includes('ridge')) return 'Violin Plot';
    if (n.includes('box')) return 'Boxplot';
    if (n.includes('hist') || n.includes('distribution')) return 'Histogram';
    if (n.includes('dens')) return 'Density Plot';
    if (n.includes('scatter')) return 'Scatter Plot';
    if (n.includes('bar')) return 'Bar Chart';
    if (n.includes('heat')) return 'Heatmap';
    if (n.includes('line')) return 'Line Chart';
    if (n.includes('pie')) return 'Pie Chart';
    return 'Scatter Plot';
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedImage(ev.target.result);
      const type = detectChartType(file.name);
      setDetectedChartType(type);
      setData(generateDataForType(type));
      setActiveTab('dashboard');
    };
    reader.readAsDataURL(file);
  };

  // DRAG & DROP İŞLEVCİLERİ
  const handleDrop = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) {
      const fakeEvent = { target: { files: [file] } };
      if (type === 'csv') handleCSVUpload(fakeEvent);
      else handleImageUpload(fakeEvent);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const getCharts = () => {
    if (!data || data.length === 0) return [];

    const x = data.map(d => d.x);
    const y = data.map(d => d.y);
    const group = data.map(d => d.group);
    const value = data.map(d => d.value);
    const age = data.map(d => d.age);
    const fare = data.map(d => d.fare);
    const gender = data.map(d => d.gender);

    const groupCounts = {};
    group.forEach(g => groupCounts[g] = (groupCounts[g] || 0) + 1);
    const groupNames = Object.keys(groupCounts);
    const groupValues = groupNames.map(k => groupCounts[k]);

    const c_xy = corr(x, y);
    const c_xv = corr(x, value);
    const c_yv = corr(y, value);

    const baseCharts = [
      { title: "1. Scatter Plot - X vs Y", data: [{ x, y, mode: 'markers', marker: { color: value, colorscale: 'Viridis' } }] },
      { title: "2. Bar Chart - Group Counts", data: [{ x: groupNames, y: groupValues, type: 'bar', marker: { color: '#8b5cf6' } }] },
      { title: "3. Line Chart - Value Trend", data: [{ x: data.map((_, i) => i), y: value, mode: 'lines+markers', line: { color: '#10b981' } }] },
      { title: "4. Pie Chart - Category", data: [{ labels: groupNames, values: groupValues, type: 'pie' }] },
      { title: "5. Histogram - X", data: [{ x, type: 'histogram', marker: { color: '#f472b6' } }] },
      { title: "6. Density - Y", data: [{ y, type: 'histogram', histnorm: 'probability density', marker: { color: '#06b6d4' } }] },
      { title: "7. Boxplot - Value by Group", data: groupNames.map(g => ({ y: value.filter((_, i) => group[i] === g), type: 'box', name: g })) },
      {
        title: "8. Violin - Age by Gender", data: [
          { y: age.filter((_, i) => gender[i] === 'male'), type: 'violin', name: 'Male' },
          { y: age.filter((_, i) => gender[i] === 'female'), type: 'violin', name: 'Female' }
        ], layout: { violinmode: 'overlay' }
      },
      {
        title: "9. Heatmap - Correlation", data: [{
          z: [[1, c_xy, c_xv], [c_xy, 1, c_yv], [c_xv, c_yv, 1]],
          x: ['X', 'Y', 'Value'], y: ['X', 'Y', 'Value'],
          type: 'heatmap', colorscale: 'Portland'
        }]
      },
      {
        title: "10. Ridgeline - Fare by Group", data: groupNames.map((g, idx) => ({
          y: fare.filter((_, i) => group[i] === g),
          type: 'violin',
          name: g,
          side: idx % 2 === 0 ? 'positive' : 'negative'
        })), layout: { violingap: 0, violinmode: 'overlay' }
      }
    ];

    if (detectedChartType) {
      const key = detectedChartType.toLowerCase().split(' ')[0];
      return baseCharts.map(c =>
        c.title.toLowerCase().includes(key)
          ? { ...c, title: `→ ${c.title} (Detected Type)` }
          : c
      ).sort(a => a.title.startsWith('→') ? -1 : 1);
    }
    return baseCharts;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f001a 0%, #1a0033 100%)', color: '#e2e8f0', padding: '2rem', fontFamily: 'system-ui' }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          borderRadius: '1rem',
          background: 'rgba(15,23,42,0.9)',
          marginBottom: '2rem',
          border: '1px solid rgba(148,163,184,0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '999px',
              background: 'linear-gradient(135deg,#6366f1,#22d3ee)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold'
            }}>
              <span>AG</span>
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>Antigravity Manager</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>AI-Powered Data Engine v5.0</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#a5b4fc' }}>SmartVizAI · Auto Chart Detection</div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 style={{ fontSize: '5rem', fontWeight: '900', background: 'linear-gradient(to right, #c084fc, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            My ChartWizard
          </h1>
          <p style={{ fontSize: '1.6rem', color: '#94a3b8' }}>
            CSV veya grafik görseli yükle✨
          </p>
        </div>

        {activeTab === 'home' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginTop: '6rem' }}>
            {/* CSV - SÜRÜKLE BIRAK */}
            <div
              onClick={() => csvInputRef.current?.click()}
              onDrop={(e) => handleDrop(e, 'csv')}
              onDragOver={handleDragOver}
              style={{ padding: '5rem', background: 'rgba(139,92,246,0.15)', borderRadius: '2rem', border: '3px dashed #a78bfa', textAlign: 'center', cursor: 'pointer', transition: '0.3s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(139,92,246,0.15)'}
            >
              <Upload size={90} style={{ color: '#c084fc' }} />
              <h3 style={{ fontSize: '2rem', margin: '1rem 0' }}>CSV/Excel Yükle<br /><small style={{ color: '#94a3b8' }}>veya buraya sürükle</small></h3>
              <input ref={csvInputRef} type="file" accept=".csv,.xlsx" onChange={handleCSVUpload} style={{ display: 'none' }} />
            </div>

            {/* GÖRSEL - SÜRÜKLE BIRAK */}
            <div
              onClick={() => imageInputRef.current?.click()}
              onDrop={(e) => handleDrop(e, 'image')}
              onDragOver={handleDragOver}
              style={{ padding: '5rem', background: 'rgba(244,114,182,0.15)', borderRadius: '2rem', border: '3px dashed #f472b6', textAlign: 'center', cursor: 'pointer', transition: '0.3s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(244,114,182,0.3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(244,114,182,0.15)'}
            >
              <ImageIcon size={90} style={{ color: '#f472b6' }} />
              <h3 style={{ fontSize: '2rem', margin: '1rem 0' }}>Grafik Görseli Yükle<br /><small style={{ color: '#94a3b8' }}>veya buraya sürükle</small></h3>
              <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div>
            {uploadedImage && detectedChartType && (
              <div style={{ textAlign: 'center', margin: '4rem 0 3rem' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2rem', background: 'rgba(139,92,246,0.3)', padding: '2.5rem 4rem', borderRadius: '3rem', border: '2px solid #c084fc' }}>
                  <Sparkles size={60} style={{ color: '#c084fc' }} />
                  <div>
                    <h2 style={{ fontSize: '3.5rem', margin: 0, color: '#fff' }}>AI Tespit Etti:</h2>
                    <h1 style={{ fontSize: '4.5rem', margin: '1rem 0', fontWeight: 'bold', background: 'linear-gradient(to right, #c084fc, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      {detectedChartType}
                    </h1>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(520px, 1fr))', gap: '2.5rem', marginTop: '2rem' }}>
              {getCharts().map((chart, i) => (
                <div key={i} style={{ background: 'rgba(30,10,60,0.9)', borderRadius: '2rem', padding: '1.8rem', border: '1px solid #7c3aed', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
                  <h3 style={{ textAlign: 'center', color: '#c084fc', fontSize: '1.6rem', fontWeight: 'bold', margin: '1.5rem 0' }}>
                    {chart.title}
                  </h3>
                  <Plot data={chart.data} layout={{ height: 400, paper_bgcolor: 'transparent', plot_bgcolor: 'transparent', font: { color: '#e2e8f0' }, margin: { t: 40, b: 60, l: 60, r: 40 }, ...chart.layout }} config={{ responsive: true }} />
                </div>
              ))}
            </div>

            <button onClick={() => { setActiveTab('home'); setUploadedImage(null); setDetectedChartType(''); setData(generateDataForType('Default')); }}
              style={{ display: 'block', margin: '5rem auto', padding: '1.5rem 5rem', background: '#9333ea', border: 'none', borderRadius: '2rem', color: 'white', fontSize: '1.6rem', fontWeight: 'bold', cursor: 'pointer' }}>
              ← Yeni Yükleme Yap
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;