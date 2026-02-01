# 🔬 Deep Analytics - Quick Reference

## 🚀 Quick Start

### Access Deep Analytics
1. Login as Admin
2. Click **📊 Analytics** tab
3. Click **🔬 Deep Analytics** button

---

## 📊 4 Main Views

### 1. 📊 Statistics
**What you see:**
- Total students, at-risk count
- Academic & assessment averages
- Statistical breakdown (mean, median, std dev)
- Performance distribution chart

**When to use:**
- Weekly class performance review
- Understanding overall cohort health
- Identifying performance gaps

### 2. 📈 Correlations
**What you see:**
- 6 correlation analyses with strengths
- Pearson coefficients (r values)
- R² goodness of fit
- Plain English interpretations

**When to use:**
- Validating program effectiveness
- Understanding metric relationships
- Research and reporting

**Key Correlations:**
- Academic ↔ Assessment
- Academic ↔ SEL
- Academic ↔ Critical Thinking
- Academic ↔ Leadership
- SEL ↔ Critical Thinking
- SEL ↔ Leadership

### 3. ⚠️ At-Risk
**What you see:**
- List of students needing support
- Risk levels (High/Medium/Low)
- Risk factors
- Intervention recommendations

**When to use:**
- Planning tutoring sessions
- Resource allocation
- Parent communications
- Progress monitoring

### 4. 💾 Export
**What you see:**
- 5 export options
- Download buttons
- File format info

**Exports Available:**
- 📄 Full Analytics (CSV)
- 📈 Correlations (CSV)
- 📊 Cohort Stats (CSV)
- 💾 Complete Report (JSON)
- ⚠️ At-Risk Students (CSV)

---

## 🎯 Common Tasks

### Find At-Risk Students
```
1. Deep Analytics → At-Risk tab
2. Review High/Medium risk students
3. Note recommendations
4. Export At-Risk CSV
```

### Check Program Effectiveness
```
1. Deep Analytics → Correlations tab
2. Look at "Academic vs SEL"
3. Check r value (>0.5 = good correlation)
4. Read interpretation
```

### Create Report for Admin
```
1. Deep Analytics → Export tab
2. Download "Complete Report (JSON)"
3. Download "Cohort Stats (CSV)"
4. Download "Correlations (CSV)"
```

### Monitor Class Performance
```
1. Deep Analytics → Statistics tab
2. Check average scores
3. Review distribution
4. Compare to previous week
```

---

## 📈 Understanding Correlations

### Correlation Strength

| r Value | Strength | Meaning |
|---------|----------|---------|
| ≥ 0.9 | Very Strong | Metrics move together |
| 0.7-0.9 | Strong | Clear relationship |
| 0.5-0.7 | Moderate | Some relationship |
| 0.3-0.5 | Weak | Slight relationship |
| < 0.3 | Very Weak | Little relationship |

### What Positive Correlation Means
- As one metric ↑, the other ↑
- Example: "Academic vs SEL" r=0.72
  - Higher SEL → Higher Academic

### What to Look For
- ✅ Strong positive correlations validate program
- ⚠️ Weak correlations suggest independent factors
- 🔍 Negative correlations need investigation

---

## ⚠️ Risk Levels Explained

### High Risk (Red)
- Risk Score ≥ 5
- **Action:** Immediate intervention
- Examples:
  - Academic < 40%
  - SEL < 50%
  - Multiple low scores

### Medium Risk (Yellow)
- Risk Score 3-4
- **Action:** Monitor closely
- Examples:
  - Academic 40-60%
  - One or two concerning metrics

### Low Risk (Gray)
- Risk Score 1-2
- **Action:** Standard support
- Examples:
  - Academic 60-75%
  - Minor improvement areas

---

## 💾 Export Guide

### Which Export to Use?

**For Excel Analysis:**
- Full Analytics CSV (student data)
- Cohort Stats CSV (summary stats)
- Correlations CSV (relationships)

**For Complete Backup:**
- Complete Report JSON (everything)

**For Specific Issues:**
- At-Risk Students CSV (interventions)

### File Naming
- Format: `brain-grain-[type]-[timestamp].csv`
- Example: `brain-grain-analytics-1737849600000.csv`

---

## 🔢 Key Statistics

### Mean vs Median
- **Mean:** Average of all values
- **Median:** Middle value
- Different? → Outliers present

### Standard Deviation (σ)
- **Low:** Students similar (σ < 10)
- **Medium:** Some variation (σ 10-20)
- **High:** Wide variation (σ > 20)

### Percentiles
- **25th:** Bottom quarter threshold
- **50th:** Median (middle)
- **75th:** Top quarter threshold

---

## 💡 Pro Tips

### Weekly Workflow
1. Monday: Check At-Risk tab
2. Wednesday: Review Statistics
3. Friday: Export data for records

### Monthly Workflow
1. Compare current vs previous month exports
2. Track correlation changes
3. Adjust interventions based on data

### Before Parent Meetings
1. Export Full Analytics CSV
2. Filter for specific student
3. Compare to cohort average
4. Note risk level & recommendations

### For Reports
1. Statistics tab → Screenshot summaries
2. Export all CSVs
3. Correlations tab → Key insights
4. At-Risk tab → Action items

---

## 🚨 Quick Troubleshooting

### "Insufficient data for correlations"
**Fix:** Need 3+ students with complete data

### No at-risk students
**Good news!** Everyone performing well

### Export not downloading
**Fix:** Check browser download settings

### Stats look wrong
**Fix:** Verify data entry accuracy

---

## 📱 Mobile Access

- Dashboard works on mobile
- Best on tablet or larger
- Exports download to device
- Responsive design

---

## 🎓 Interpretation Examples

### Good Correlation
```
Academic vs SEL: r = 0.72
✓ Strong positive relationship
✓ SEL program is effective
✓ Continue current approach
```

### Concern Flag
```
Academic vs Critical Thinking: r = 0.28
⚠ Weak correlation
? Critical thinking not helping academics
→ Review teaching methods
```

### At-Risk Example
```
Student: Ravi Kumar
Risk: HIGH (Score: 7)
Factors: Academic 35%, SEL 42%
Actions:
- Assign tutor immediately
- SEL counseling sessions
- Daily check-ins
```

---

## 📞 Need Help?

1. **Check:** DEEP_ANALYTICS_GUIDE.md (full docs)
2. **Debug:** Open browser console (F12)
3. **Data:** Export JSON and review
4. **Test:** Try with demo data first

---

## ✅ Checklist

Before using Deep Analytics:
- [ ] At least 3 students registered
- [ ] Academic scores entered
- [ ] Assessments completed
- [ ] Data verified for accuracy

Regular maintenance:
- [ ] Weekly: Check at-risk students
- [ ] Monthly: Export data for trends
- [ ] Quarterly: Review correlations
- [ ] Yearly: Full cohort comparison

---

**Quick Links:**
- Full Documentation: [DEEP_ANALYTICS_GUIDE.md](DEEP_ANALYTICS_GUIDE.md)
- Main Platform: [index.html](index.html)
- Analytics Module: [deep-analytics.js](deep-analytics.js)

**Version:** 1.0 | **Date:** January 25, 2026
